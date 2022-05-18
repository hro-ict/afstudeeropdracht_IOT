
#if defined(ESP32)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include <Ticker.h>
Ticker ticker;
String pass;
String ssid;


#include <addons/TokenHelper.h>

/* 2. Define the API Key */
#define API_KEY "Api_key"

/* 3. Define the project ID */
#define FIREBASE_PROJECT_ID "arduinonodemcu-fe6ea"

/* 4. Define the user Email and password that alreadey registerd or added in your project */
#define USER_EMAIL user_email"
#define USER_PASSWORD "password"


//ntp server

#include <NTPClient.h>
#include <WiFiUdp.h>
//ntp server


#include "DHTesp.h"
DHTesp dht;
WiFiManager wm;
const long utcOffsetInSeconds = 7200;
// Define Firebase Data objectdocumentPath 
FirebaseData fbdo;

FirebaseAuth auth;
FirebaseConfig config;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds);
unsigned long dataMillis = 0;
int count = 0;


//send notification to mobile app

void sendMessage(String title, String notification)
{

    Serial.print("Send Firebase Cloud Messaging... ");

    // Read more details about legacy HTTP API here https://firebase.google.com/docs/cloud-messaging/http-server-ref
    FCM_Legacy_HTTP_Message msg;

    msg.targets.to = "/topics/containers";

    msg.options.time_to_live = "1000";
    msg.options.priority = "high";

    msg.payloads.notification.title = title.c_str();
    msg.payloads.notification.body = notification.c_str();
    msg.payloads.notification.icon = "myicon";
    //msg.payloads.notification.click_action = "OPEN_ACTIVITY_1";

    FirebaseJson payload;

    // all data key-values should be string
    payload.add("temp", "28");
    payload.add("unit", "celsius");
    payload.add("timestamp", "1609815454");
    msg.payloads.data = payload.raw();

    if (Firebase.FCM.send(&fbdo, &msg)) // send message to recipient
        Serial.printf("ok\n%s\n\n", Firebase.FCM.payload(&fbdo).c_str());
    else
        Serial.println(fbdo.errorReason());

    count++;
}



//blink

void tick()
{
  //toggle state
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));     // set pin to the opposite state
}



void setup()
{
    
    Serial.begin(115200);
      dht.setup(D0, DHTesp::DHT22);
      timeClient.begin();

//wifi manager

pinMode(LED_BUILTIN, OUTPUT); 
     ticker.attach(0.2, tick);
    WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP

    // put your setup code here, to run once:
    Serial.begin(115200);
    
    bool res;

    res = wm.autoConnect(); // password protected ap

    if(!res) {
        Serial.println("Failed to connect");
        // ESP.restart();
    } 
    else {
        //if you get here you have connected to the WiFi    
        Serial.println("connected...yeey :)");
        pass= wm.getWiFiPass(true);
        ssid= WiFi.SSID();
         ticker.detach();
        digitalWrite(LED_BUILTIN, HIGH);
        
        
    }



    Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

    /* Assign the api key (required) */
    config.api_key = API_KEY;

    /* Assign the user sign in credentials */
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;

    /* Assign the callback function for the long running token generation task */
    config.token_status_callback = tokenStatusCallback; // see addons/TokenHelper.h

    Firebase.begin(&config, &auth);
    Firebase.FCM.setServerKey("AAAAWPSstoI:APA91bHEK1OJYDDXHLkDJa9QJbURYhr4XgiqqTR_uO0jGOT82vkboLjb0ZO4C1t1dxOyzNYi-exDhf7Su54IxeKujnVd6nWzWiMCCkaIVsA4aYcC6J623a73MQbYjc9Mg8X-3fmAhmPn");

    Firebase.reconnectWiFi(true);

    sendMessage(".......Welkom.......", "Dit is een test melding"); //test message
}

void loop()
{

float temperature = dht.getTemperature();  
WiFi.begin(ssid.c_str(), pass.c_str());
Serial.println(get_time() );

if (get_notification_state() and temperature>4 ){
  sendMessage("Temperatuur koelcontainer 2 hoog", "Temperatuur: "+ String(temperature)); 
  }

delay(1800000); //30 minutes interval
}

void firestore(float temp, String date){
  
   if (Firebase.ready() && (millis() - dataMillis > 60000 || dataMillis == 0))
    {
       

        Serial.print("Commit a document (append array)... ");

       
        std::vector<struct fb_esp_firestore_document_write_t> writes;
        struct fb_esp_firestore_document_write_t transform_write;

        transform_write.type = fb_esp_firestore_document_write_type_transform;

       
        transform_write.document_transform.transform_document_path = "Delibert/Koelcontainers";

        
        struct fb_esp_firestore_document_write_field_transforms_t field_transforms;

      
        field_transforms.fieldPath = "container_2";
        

     
        field_transforms.transform_type = fb_esp_firestore_transform_type_append_missing_elements;

        FirebaseJson content;
 
     
      //mapValue/fields/name/stringValue", "wrench"

          content.set("values/mapValue/fields/date/stringValue", date);
          content.set("values/mapValue/fields/temp/doubleValue", String(temp));

      
        field_transforms.transform_content = content.raw();

       
        transform_write.document_transform.field_transforms.push_back(field_transforms);

        
        writes.push_back(transform_write);

        if (Firebase.Firestore.commitDocument(&fbdo, FIREBASE_PROJECT_ID, "" /* databaseId can be (default) or empty */, writes /* dynamic array of fb_esp_firestore_document_write_t */, "" /* transaction */))
            {

                  Serial.println(fbdo.payload());
          
            }
        else
            Serial.println(fbdo.errorReason());
    }

  
  }


String get_time(){
  String current_time= "";
  timeClient.update();

 time_t epochTime = timeClient.getEpochTime();
  Serial.print("Epoch Time: ");
  Serial.println(epochTime);

String formattedTime = timeClient.getFormattedTime();
  Serial.print("Formatted Time: ");
  Serial.println(formattedTime);  

struct tm *ptm = gmtime ((time_t *)&epochTime); 

int currentMonth = ptm->tm_mon+1;
int monthDay = ptm->tm_mday;

String str_monthDay, str_currentMonth, hour_, minute_;

if (monthDay<10){
  str_monthDay= "0"+String(monthDay);
 }
else {str_monthDay= String(monthDay);}

if (currentMonth<10){
  str_currentMonth= "0"+String(currentMonth);
 }
else {str_currentMonth= String(currentMonth);}

if (timeClient.getHours()<10){
  hour_= "0"+String(timeClient.getHours());
}
else { hour_= String(timeClient.getHours());}

if (timeClient.getMinutes()<10){
  minute_= "0"+String(timeClient.getMinutes());
  }
else {
  minute_= String(timeClient.getMinutes());
  
  }
  
current_time= str_monthDay+"-"+str_currentMonth +" "+ hour_+":"+minute_;
return current_time;
  }


bool get_notification_state(){
  
        String documentPath = "Delibert/Notification";
        String mask = "Koelcontainer_2";

        Serial.print("Get a document... ");

        if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), mask.c_str()))
            {
              //Serial.printf("ok\n%s\n\n", fbdo.payload().c_str());
              
             if(fbdo.payload().indexOf("true")>0){
              return true;
              }
              else {
                return false;
                }
            
             
            }
        else
            Serial.println(fbdo.errorReason());
  
  
  }
