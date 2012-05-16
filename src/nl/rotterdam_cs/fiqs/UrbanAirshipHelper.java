package nl.rotterdam_cs.fiqs;

import nl.rotterdam_cs.fiqs_test.R;
import android.app.Application;

import com.urbanairship.AirshipConfigOptions;
import com.urbanairship.UAirship;
import com.urbanairship.push.PushManager;


/**
 * Helper class used to centralized Urban Airship 
 * useful functions
 *  
 * @author marcoslacoste
 *
 */
public class UrbanAirshipHelper {

	private static UrbanAirshipHelper instance;

	private boolean urbanAirshipRegistered;
	private String urbanAirshipAPID;
	
	private UrbanAirshipHelper(){
	}
	
	public static UrbanAirshipHelper getInstance(){
		if (instance == null){
			instance = new UrbanAirshipHelper();
		}
		return instance;
	}
	
	/**
	 * Initializes Urban Airship service
	 * @param app
	 */
	public void initUrbanAirship(Application app){
		// load Urban Airship configuration
		AirshipConfigOptions options = new AirshipConfigOptions();
		options.c2dmSender = app.getString(R.string.urban_airship_c2dmsender);
		options.developmentAppKey = app.getString(R.string.urban_airship_development_app_key);
		options.developmentAppSecret = app.getString(R.string.urban_airship_development_app_secret);
		options.productionAppKey = app.getString(R.string.urban_airship_production_app_key);
		options.productionAppSecret = app.getString(R.string.urban_airship_production_app_secret);
		options.transport = app.getString(R.string.urban_airship_transport);
		options.inProduction = Boolean.valueOf(app.getString(R.string.urban_airship_in_production));
		options.iapEnabled = Boolean.valueOf(app.getString(R.string.urban_airship_iap_enabled));
		
		
		// start Urban Airship registration process
		UAirship.takeOff(app, options);
		PushManager.shared().setIntentReceiver(CustomBroadcastReceiver.class);
		PushManager.enablePush();
	}
	
	/**
	 * Returns true if these two conditions are valid:
	 * a) Urban Airship is properly set up
	 * b) The device has successfully been registered in Urban Airship
	 * @return
	 */
	public boolean isUrbanAirshipUp(){
		return UAirship.shared().isFlying() && isUrbanAirshipRegistered();
	}

	public boolean isUrbanAirshipRegistered() {
		return urbanAirshipRegistered;
	}

	public void setUrbanAirshipRegistered(boolean urbanAirshipRegistered) {
		this.urbanAirshipRegistered = urbanAirshipRegistered;
	}

	public String getUrbanAirshipAPID() {
		return urbanAirshipAPID;
	}

	public void setUrbanAirshipAPID(String urbanAirshipAPID) {
		this.urbanAirshipAPID = urbanAirshipAPID;
	}
	
	
}
