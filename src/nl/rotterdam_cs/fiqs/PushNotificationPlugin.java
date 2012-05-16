package nl.rotterdam_cs.fiqs;

import org.apache.cordova.api.PluginResult.Status;
import org.json.JSONArray;

import android.util.Log;

import com.phonegap.api.Plugin;
import com.phonegap.api.PluginResult;

/**
 * PhoneGap plugin that allows us to retrieve APID
 * used for Push Messages from JavaScript scope
 * 
 * @author marcoslacoste
 *
 */
public class PushNotificationPlugin extends Plugin{

    	final static String TAG = PushNotificationPlugin.class.getSimpleName();

	    public static final String ACTION_GET_APID = "getAPID";

	    
	    @Override
	    public PluginResult execute(String action, JSONArray data,  String callbackId) {

	    	PluginResult result = null;
	    	
	        if (ACTION_GET_APID.equals(action)) {
	        	result = new PluginResult(Status.OK, UrbanAirshipHelper.getInstance().getUrbanAirshipAPID());
	        } else {
	            Log.d(TAG, "Invalid action: " + action + " passed");
	            result = new PluginResult(Status.INVALID_ACTION);
	        }
	        
	        return result;
	        
	    }
	    

	    
}
