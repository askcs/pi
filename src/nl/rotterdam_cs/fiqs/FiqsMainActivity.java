package nl.rotterdam_cs.fiqs;

import nl.ask.paige.app.Paige;
import android.os.Bundle;

import com.urbanairship.Logger;
import com.urbanairship.UAirship;

/**
 * Main FIQS Activity
 * 
 * Extends from Paige activity in order to
 * add phonegap plugin that allows us to handle
 * push notifications from JavaScript
 * 
 * @author marcoslacoste
 *
 */
public class FiqsMainActivity extends Paige{

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
	}
	
	
	@Override
	protected void onStart() {
		super.onStart();
		// Resume Urban Airship analytics
		UAirship.shared().getAnalytics().activityStarted(this);
	}
	
	@Override
	protected void onResume() {
		super.onResume();
		Logger.debug("Resuming \"FiqsMainActivity\" ...");
		
		// if Urban Airship could not be started, then try again when resuming app
		UrbanAirshipHelper urbanAirshipHelper = UrbanAirshipHelper.getInstance();
				
		Logger.debug("UAirship correctly set up? " + UAirship.shared().isFlying());
		Logger.debug("UAirship registered? " + urbanAirshipHelper.isUrbanAirshipRegistered());
		
		Logger.debug("UAirship Up? " + urbanAirshipHelper.isUrbanAirshipUp());
		Logger.debug("UAirship APID? " + urbanAirshipHelper.getUrbanAirshipAPID());

	}
	
	@Override
	protected void onStop() {
		super.onStop();
		// Stop Urban Airship analytics
		UAirship.shared().getAnalytics().activityStopped(this);

    }
	
}
