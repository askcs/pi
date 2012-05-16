package nl.rotterdam_cs.fiqs;

import android.app.Application;

/**
 * Main Application class for FIQS Driving Application
 * This class needs to be extended in order to be able to
 * incorporate Urban Airship initialization
 * 
 * @author marcoslacoste
 *
 */
public class FiqsDrivingApplication extends Application {

	
	@Override
	public void onCreate() {
		super.onCreate();
		
	    // init Urban Airship when starting up the application
		UrbanAirshipHelper.getInstance().initUrbanAirship(this);
	}
	
	


	
	
	
}
