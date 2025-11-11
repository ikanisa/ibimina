package rw.gov.ikanisa.ibimina.client;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import rw.gov.ikanisa.ibimina.client.auth.DeviceAuthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register custom plugins
        registerPlugin(MoMoNotificationListenerPlugin.class);
        registerPlugin(SmsUserConsentPlugin.class);
        registerPlugin(DeviceAuthPlugin.class);
    }
}
