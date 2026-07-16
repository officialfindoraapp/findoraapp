package com.findora.app.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.PropertyName

data class Device(
    @get:PropertyName("deviceId") @set:PropertyName("deviceId")
    var deviceId: String = "",
    
    @get:PropertyName("deviceName") @set:PropertyName("deviceName")
    var deviceName: String = "",
    
    @get:PropertyName("deviceModel") @set:PropertyName("deviceModel")
    var deviceModel: String = "",
    
    @get:PropertyName("androidVersion") @set:PropertyName("androidVersion")
    var androidVersion: String = "",
    
    @get:PropertyName("batteryPercentage") @set:PropertyName("batteryPercentage")
    var batteryPercentage: Int = 100,
    
    @get:PropertyName("isCharging") @set:PropertyName("isCharging")
    var isCharging: Boolean = false,
    
    @get:PropertyName("isOnline") @set:PropertyName("isOnline")
    var isOnline: Boolean = true,
    
    @get:PropertyName("lastSyncTime") @set:PropertyName("lastSyncTime")
    var lastSyncTime: Timestamp? = null,
    
    @get:PropertyName("latitude") @set:PropertyName("latitude")
    var latitude: Double = 0.0,
    
    @get:PropertyName("longitude") @set:PropertyName("longitude")
    var longitude: Double = 0.0,
    
    @get:PropertyName("locationAccuracy") @set:PropertyName("locationAccuracy")
    var locationAccuracy: Float = 0f,
    
    @get:PropertyName("speed") @set:PropertyName("speed")
    var speed: Double = 0.0,
    
    @get:PropertyName("bearing") @set:PropertyName("bearing")
    var bearing: Float = 0f
)

data class LocationHistoryItem(
    var id: String = "",
    var latitude: Double = 0.0,
    var longitude: Double = 0.0,
    var timestamp: Timestamp? = null,
    var batteryLevel: Int = 100,
    var status: String = "Online",
    var speed: Double = 0.0,
    var bearing: Float = 0f,
    var accuracy: Double = 0.0
)
