package com.ibimina.client.data.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import io.github.jan.supabase.auth.SessionManager
import io.github.jan.supabase.auth.user.UserSession
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Persists Supabase [UserSession] instances using Jetpack DataStore.
 */
@Singleton
class SupabaseSessionManager @Inject constructor(
    @ApplicationContext context: Context
) : SessionManager {

    private val json = Json { ignoreUnknownKeys = true }

    private val Context.sessionDataStore: DataStore<Preferences> by preferencesDataStore(
        name = "ibimina_session"
    )

    private val dataStore = context.sessionDataStore

    private val sessionKey = stringPreferencesKey("supabase_session")

    /**
     * Observable flow of the cached session.
     */
    val sessionFlow: Flow<UserSession?> = dataStore.data.map { prefs ->
        prefs[sessionKey]?.let { stored ->
            runCatching { json.decodeFromString(UserSession.serializer(), stored) }.getOrNull()
        }
    }

    override suspend fun saveSession(session: UserSession) {
        dataStore.edit { prefs ->
            prefs[sessionKey] = json.encodeToString(UserSession.serializer(), session)
        }
    }

    override suspend fun loadSession(): UserSession? {
        return sessionFlow.first()
    }

    override suspend fun deleteSession() {
        dataStore.edit { prefs -> prefs.remove(sessionKey) }
    }
}
