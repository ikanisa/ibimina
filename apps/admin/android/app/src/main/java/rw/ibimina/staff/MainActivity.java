package rw.ibimina.staff;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import rw.ibimina.staff.plugins.SmsIngestPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        registerPlugin(SmsIngestPlugin.class);
    }
}
