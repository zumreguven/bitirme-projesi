#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Mobizt Firebase Kütüphanesi İçin Yardımcı Dosyalar
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- Wi-Fi Ayarları ---
const char* ssid = "FiberHGW_ZTT9YU";       
const char* password = "Malatya1244."; 

// --- Firebase Ayarları ---
#define API_KEY "AIzaSyCRnER5vcP8fN4MMOXnEZKDduzqjeXfiDI"
#define DATABASE_URL "https://bitki-sulama-5903b-default-rtdb.europe-west1.firebasedatabase.app"

// --- Cihaz Kimliği (Sabit) ---
// Bu kimlik cihazın kendisine aittir. Mobil uygulamada bitkiyi bu cihaza eşleştirirken bu kodu kullanacaksınız.
#define DEVICE_ID "BITKI_MOTOR_01"

// Firebase Objeleri
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- Donanım Pinleri ---
#define MOISTURE_PIN 18  // Sensör AO ucu GPIO 18'de
#define RELAY_PIN 17     // Röle IN ucu GPIO 17'de

// --- Durum Değişkenleri ---
unsigned long lastUpdate = 0;
bool isSystemActive = false;
bool forceStop = false;
int waterStartADC = 2500;  // Kuru eşik değeri (bunun üstü kuru)
int waterStopADC = 1000;   // Islak eşik değeri (opsiyonel)

// Sensör nem değerini 0-100 arasına dönüştürmek için min-max değerler (ADC kalibrasyonu)
const int DRY_VALUE = 4095; // Sensör tam kuruyken (havada)
const int WET_VALUE = 0;    // Sensör tamamen suyun içindeyken

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Motor kapalı başlat
  
  Serial.println("=== ESP32-S3 IoT Otomatik Sulama Sistemi ===");

  // --- Wi-Fi Bağlantısı ---
  Serial.print("Wi-Fi agina baglaniliyor...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\nWi-Fi Baglandi! IP Adresi: ");
  Serial.println(WiFi.localIP());

  // --- Firebase Kurulumu ---
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonim giriş veya kimlik doğrulamasız bağlanmak için sign up ayarı
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth Basarili!");
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  // Helper ayarları
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready() && (millis() - lastUpdate > 2000 || lastUpdate == 0)) {
    lastUpdate = millis();

    // 1. Firebase'den Cihaz Ayarlarını Oku
    String devicePath = String("devices/") + DEVICE_ID;
    
    // Sistem Aktif mi?
    if (Firebase.RTDB.getBool(&fbdo, devicePath + "/is_system_active")) {
      isSystemActive = fbdo.boolData();
    } else {
      Serial.println(fbdo.errorReason());
    }

    // Acil Durdurma Aktif mi?
    if (Firebase.RTDB.getBool(&fbdo, devicePath + "/force_stop")) {
      forceStop = fbdo.boolData();
    }
    
    // Kuru/Islak Eşikleri Oku
    if (Firebase.RTDB.getInt(&fbdo, devicePath + "/waterStartADC")) {
      waterStartADC = fbdo.intData();
    }
    if (Firebase.RTDB.getInt(&fbdo, devicePath + "/waterStopADC")) {
      waterStopADC = fbdo.intData();
    }

    // 2. Sensör Verisi Oku
    int rawNemDegeri = analogRead(MOISTURE_PIN);
    
    // 0-100% arasına çevirme (opsiyonel gösterim için, ham veri de kullanılabilir)
    int nemYuzde = map(rawNemDegeri, DRY_VALUE, WET_VALUE, 0, 100);
    nemYuzde = constrain(nemYuzde, 0, 100);

    // 3. Motor Kararı Ver (Sistem aktifse ve force_stop yoksa)
    int motorDurumu = 0; // 0: Kapalı, 1: Açık
    bool isRelayOn = (digitalRead(RELAY_PIN) == LOW); // Röle LOW iken motor açık
    
    if (isSystemActive && !forceStop) {
      if (rawNemDegeri >= waterStartADC) {
        // Toprak Kurumuş (StartADC'ye ulaşılmış) -> Motoru Aç
        digitalWrite(RELAY_PIN, LOW); 
        motorDurumu = 1;
        Serial.print("[MOTOR ACIK] ");
      } else if (rawNemDegeri <= waterStopADC) {
        // Toprak İyice Islanmış (StopADC'ye ulaşılmış) -> Motoru Kapat
        digitalWrite(RELAY_PIN, HIGH); 
        motorDurumu = 0;
        Serial.print("[MOTOR KAPALI] ");
      } else {
        // Nem değeri Başlama ve Bitirme eşikleri arasında (Histerezis) -> Mevcut durumu koru
        if (isRelayOn) {
          motorDurumu = 1;
          Serial.print("[MOTOR ACIK - Sulamaya Devam] ");
        } else {
          motorDurumu = 0;
          Serial.print("[MOTOR KAPALI - Kurumasi Bekleniyor] ");
        }
      }
    } else {
      // Sistem kapalı veya acil durdurma devrede
      digitalWrite(RELAY_PIN, HIGH); // Motor Kapalı
      motorDurumu = 0;
      Serial.print("[SISTEM KAPALI] ");
    }

    Serial.printf("Ham Nem: %d, Yuzde: %%%d, Start: %d, Stop: %d\n", rawNemDegeri, nemYuzde, waterStartADC, waterStopADC);

    // 4. Durumu Firebase'e Yaz
    String sensorPath = devicePath + "/sensor_data";
    
    FirebaseJson json;
    json.set("moisture", nemYuzde);
    json.set("motor_status", motorDurumu);
    
    // Gerçek zamanlı saat (Server Timestamp)
    FirebaseJson ts;
    ts.set(".sv", "timestamp");
    json.set("last_updated", ts);
    
    if (!Firebase.RTDB.updateNode(&fbdo, sensorPath, &json)) {
       Serial.println("Veri gonderilemedi: " + fbdo.errorReason());
    }
  }
}