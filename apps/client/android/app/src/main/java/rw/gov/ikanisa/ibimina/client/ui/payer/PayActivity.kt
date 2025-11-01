package rw.gov.ikanisa.ibimina.client.ui.payer

import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.lifecycle.lifecycleScope
import com.tapmomo.feature.Network
import com.tapmomo.feature.R
import com.tapmomo.feature.core.SimUtils
import com.tapmomo.feature.data.SupabaseClient
import com.tapmomo.feature.data.TapMoMoRepository
import com.tapmomo.feature.data.entity.TransactionEntity
import com.tapmomo.feature.data.models.PaymentPayload
import com.tapmomo.feature.data.models.SimInfo
import com.tapmomo.feature.nfc.PayloadValidator
import com.tapmomo.feature.nfc.ReaderController
import com.tapmomo.feature.nfc.ValidationResult
import com.tapmomo.feature.nfc.readPayloadAsync
import com.tapmomo.feature.ussd.UssdLaunchResult
import com.tapmomo.feature.ussd.UssdLauncher
import kotlinx.coroutines.launch

class PayActivity : ComponentActivity(), NfcAdapter.ReaderCallback {

    private val repository by lazy { TapMoMoRepository(this) }
    private val validator by lazy { PayloadValidator(repository) }
    private val readerController by lazy { ReaderController(this) }

    private var nfcAdapter: NfcAdapter? = null
    private var uiState by mutableStateOf(
        PayUiState(
            isNfcAvailable = true,
            isNfcEnabled = true,
            needsSimPermission = !SimUtils.hasPhonePermission(this)
        )
    )

    private var pendingPayload: PaymentPayload? = null
    private var pendingSimId: Int? = null
    private var currentTransaction: TransactionEntity? = null
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)

        permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { results ->
            val denied = results.filterValues { granted -> !granted }.keys
            if (denied.isEmpty()) {
                refreshSimCards()
                val payload = pendingPayload
                val simId = pendingSimId
                if (payload != null) {
                    lifecycleScope.launch {
                        handlePaymentConfirmation(payload, simId)
                    }
                }
            } else {
                updateState {
                    it.copy(
                        errorMessage = getString(
                            R.string.tapmomo_error_permission_denied,
                            denied.joinToString(", ")
                        ),
                        confirmationPayload = null,
                        isScanning = false
                    )
                }
                clearPending()
            }
        }

        lifecycleScope.launch {
            repository.cleanupOldData()
        }

        updateState {
            it.copy(
                isNfcAvailable = nfcAdapter != null,
                isNfcEnabled = nfcAdapter?.isEnabled == true,
                needsSimPermission = !SimUtils.hasPhonePermission(this@PayActivity)
            )
        }

        setContent {
            MaterialTheme {
                PayActivityScreen(
                    state = uiState,
                    onClose = { finish() },
                    onStartScan = { startScanning() },
                    onCancelConfirmation = { cancelConfirmation() },
                    onConfirmPayment = { simId -> confirmPayment(simId) },
                    onSimSelected = { simId -> updateSimSelection(simId) },
                    onOpenNfcSettings = { openNfcSettings() },
                    onResultClosed = { finish() },
                    onMarkSettled = { markCurrentTransactionAs("settled") },
                    onMarkFailed = { markCurrentTransactionAs("failed") }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateState {
            it.copy(
                isNfcEnabled = nfcAdapter?.isEnabled == true,
                needsSimPermission = !SimUtils.hasPhonePermission(this@PayActivity)
            )
        }
        if (uiState.isScanning && uiState.isNfcEnabled) {
            enableReaderMode()
        }
    }

    override fun onPause() {
        super.onPause()
        disableReaderMode()
    }

    override fun onDestroy() {
        super.onDestroy()
        disableReaderMode()
    }

    override fun onTagDiscovered(tag: Tag) {
        lifecycleScope.launch {
            val payload = readerController.readPayloadAsync(tag)
            if (payload == null) {
                updateState {
                    it.copy(
                        errorMessage = getString(R.string.tapmomo_error_invalid_payload),
                        isScanning = false
                    )
                }
                disableReaderMode()
                return@launch
            }

            handlePayload(payload)
        }
    }

    private fun startScanning() {
        if (nfcAdapter == null) {
            updateState {
                it.copy(
                    isNfcAvailable = false,
                    errorMessage = getString(R.string.tapmomo_error_nfc_unavailable),
                    isScanning = false
                )
            }
            return
        }

        if (nfcAdapter?.isEnabled != true) {
            updateState {
                it.copy(
                    isNfcEnabled = false,
                    errorMessage = getString(R.string.tapmomo_error_nfc_disabled),
                    isScanning = false
                )
            }
            return
        }

        updateState {
            it.copy(
                isScanning = true,
                errorMessage = null,
                warningMessage = null,
                confirmationPayload = null,
                result = null
            )
        }
        enableReaderMode()
    }

    private fun cancelConfirmation() {
        updateState {
            it.copy(
                confirmationPayload = null,
                warningMessage = null,
                isScanning = false
            )
        }
        clearPending()
    }

    private fun confirmPayment(simId: Int?) {
        val payload = uiState.confirmationPayload ?: return
        lifecycleScope.launch {
            handlePaymentConfirmation(payload, simId)
        }
    }

    private fun updateSimSelection(simId: Int?) {
        updateState {
            it.copy(selectedSimId = simId)
        }
    }

    private suspend fun handlePayload(payload: PaymentPayload) {
        val merchantSecret = if (SupabaseClient.isInitialized()) {
            SupabaseClient.fetchMerchantSecret(payload.merchantId)
        } else {
            null
        }

        when (val validation = validator.validate(payload, merchantSecret)) {
            is ValidationResult.Valid -> {
                showConfirmation(payload, warning = null)
            }

            is ValidationResult.UnsignedWarning -> {
                showConfirmation(validation.payload, warning = getString(R.string.tapmomo_warning_unsigned_message))
            }

            is ValidationResult.Invalid -> {
                updateState {
                    it.copy(
                        errorMessage = validation.reason,
                        isScanning = false
                    )
                }
            }
        }

        disableReaderMode()
    }

    private fun showConfirmation(payload: PaymentPayload, warning: String?) {
        val sims = refreshSimCards()
        val selected = uiState.selectedSimId?.takeIf { id -> sims.any { it.subscriptionId == id } }
            ?: sims.firstOrNull()?.subscriptionId

        updateState {
            it.copy(
                confirmationPayload = payload,
                warningMessage = warning,
                isScanning = false,
                errorMessage = null,
                selectedSimId = selected,
                result = null
            )
        }
    }

    private suspend fun handlePaymentConfirmation(payload: PaymentPayload, simId: Int?) {
        val network = runCatching { Network.valueOf(payload.network) }.getOrNull()
        if (network == null) {
            updateState {
                it.copy(
                    errorMessage = getString(R.string.tapmomo_error_invalid_payload),
                    confirmationPayload = null,
                    isScanning = false
                )
            }
            clearPending()
            return
        }

        pendingPayload = payload
        pendingSimId = simId

        when (val result = UssdLauncher.launchUssd(
            context = this,
            network = network,
            merchantId = payload.merchantId,
            amount = payload.amount,
            subscriptionId = simId
        )) {
            is UssdLaunchResult.Success -> {
                clearPending()
                persistTransaction(payload, simId)
            }

            is UssdLaunchResult.PermissionRequired -> {
                permissionLauncher.launch(result.permissions)
            }

            is UssdLaunchResult.Failure -> {
                clearPending()
                updateState {
                    it.copy(
                        errorMessage = result.reason ?: getString(R.string.tapmomo_error_ussd_failed),
                        confirmationPayload = payload
                    )
                }
            }
        }
    }

    private suspend fun persistTransaction(payload: PaymentPayload, simId: Int?) {
        val sims = uiState.simCards
        val simSlot = sims.firstOrNull { it.subscriptionId == simId }?.slotIndex
        val transaction = repository.createPayerTransaction(payload, simSlot)
        currentTransaction = transaction

        updateState {
            it.copy(
                confirmationPayload = null,
                warningMessage = null,
                result = PaymentResultUi(
                    transactionId = transaction.id,
                    merchantId = transaction.merchant_id,
                    amount = transaction.amount,
                    currency = transaction.currency,
                    status = transaction.status,
                    message = getString(R.string.tapmomo_result_pending_message)
                ),
                isScanning = false,
                errorMessage = null
            )
        }
    }

    private fun markCurrentTransactionAs(status: String) {
        val transaction = currentTransaction ?: return
        if (transaction.status == status) {
            updateState {
                it.copy(result = it.result?.copy(status = status))
            }
            return
        }

        lifecycleScope.launch {
            val updated = repository.updateTransactionStatusWithReconcile(
                id = transaction.id,
                status = status,
                merchantId = transaction.merchant_id,
                amount = transaction.amount,
                currency = transaction.currency
            )

            currentTransaction = updated
            updateState {
                val result = it.result
                if (result == null) {
                    it
                } else {
                    it.copy(
                        result = result.copy(
                            status = status,
                            message = when (status) {
                                "settled" -> getString(R.string.tapmomo_result_settled_message)
                                "failed" -> getString(R.string.tapmomo_result_failed_message)
                                else -> result.message
                            }
                        )
                    )
                }
            }
        }
    }

    private fun enableReaderMode() {
        nfcAdapter?.enableReaderMode(
            this,
            this,
            READER_FLAGS,
            null
        )
    }

    private fun disableReaderMode() {
        nfcAdapter?.disableReaderMode(this)
    }

    private fun refreshSimCards(): List<SimInfo> {
        val sims = SimUtils.getActiveSimCards(this)
        updateState {
            val selected = it.selectedSimId?.takeIf { id -> sims.any { sim -> sim.subscriptionId == id } }
                ?: sims.firstOrNull()?.subscriptionId
            it.copy(
                simCards = sims,
                selectedSimId = selected,
                needsSimPermission = !SimUtils.hasPhonePermission(this)
            )
        }
        return sims
    }

    private fun clearPending() {
        pendingPayload = null
        pendingSimId = null
    }

    private fun openNfcSettings() {
        startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
    }

    private fun updateState(transform: (PayUiState) -> PayUiState) {
        uiState = transform(uiState)
    }

    companion object {
        private const val READER_FLAGS =
            NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
    }
}

data class PayUiState(
    val isNfcAvailable: Boolean = true,
    val isNfcEnabled: Boolean = true,
    val isScanning: Boolean = false,
    val confirmationPayload: PaymentPayload? = null,
    val warningMessage: String? = null,
    val errorMessage: String? = null,
    val simCards: List<SimInfo> = emptyList(),
    val selectedSimId: Int? = null,
    val needsSimPermission: Boolean = false,
    val result: PaymentResultUi? = null
)

data class PaymentResultUi(
    val transactionId: String,
    val merchantId: String,
    val amount: Int?,
    val currency: String,
    val status: String,
    val message: String
)
