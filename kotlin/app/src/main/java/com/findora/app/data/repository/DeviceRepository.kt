package com.findora.app.data.repository

import com.findora.app.data.model.Device
import com.findora.app.data.model.LocationHistoryItem
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class DeviceRepository(private val firestore: FirebaseFirestore) {

    private val devicesCollection = firestore.collection("devices")

    /**
     * Updates device specifications, status, battery levels, and online presence in Firestore.
     */
    suspend fun updateDeviceDetails(deviceId: String, device: Device) {
        devicesCollection.document(deviceId).set(device).await()
    }

    /**
     * Updates the active, live GPS coordinates of the device.
     * Also records this coordinate set in the subcollection "location_history" to preserve history.
     */
    suspend fun updateLiveLocation(
        deviceId: String, 
        lat: Double, 
        lng: Double, 
        accuracy: Float,
        battery: Int,
        isOnline: Boolean,
        speed: Double,
        bearing: Float
    ) {
        val lastSync = Timestamp.now()
        val ownerId = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: ""
        
        // Update main device document using SetOptions.merge() so the document is created if it does not exist!
        val updates = mutableMapOf<String, Any>(
            "latitude" to lat,
            "longitude" to lng,
            "locationAccuracy" to accuracy.toDouble(),
            "batteryPercentage" to battery,
            "isOnline" to isOnline,
            "lastSyncTime" to lastSync,
            "speed" to speed,
            "bearing" to bearing.toDouble()
        )
        if (ownerId.isNotEmpty()) {
            updates["ownerId"] = ownerId
        }
        devicesCollection.document(deviceId).set(updates, com.google.firebase.firestore.SetOptions.merge()).await()

        // Push to history subcollection with unique ID so the Web App and Android App align
        val pointId = "hist_${System.currentTimeMillis()}"
        val historyItem = mutableMapOf<String, Any>(
            "id" to pointId,
            "deviceId" to deviceId,
            "latitude" to lat,
            "longitude" to lng,
            "timestamp" to lastSync,
            "batteryLevel" to battery,
            "status" to if (isOnline) "Online" else "Offline",
            "accuracy" to accuracy.toDouble(),
            "speed" to speed,
            "bearing" to bearing.toDouble()
        )
        if (ownerId.isNotEmpty()) {
            historyItem["ownerId"] = ownerId
        }
        devicesCollection.document(deviceId)
            .collection("location_history")
            .document(pointId)
            .set(historyItem)
            .await()
    }

    /**
     * Streams real-time updates of a single device configuration.
     */
    fun observeDevice(deviceId: String): Flow<Device?> = callbackFlow {
        val subscription = devicesCollection.document(deviceId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    val device = snapshot.toObject(Device::class.java)
                    trySend(device)
                } else {
                    trySend(null)
                }
            }
        awaitClose { subscription.remove() }
    }

    /**
     * Fetches historical tracking coordinates ordered by chronological descending timestamp.
     */
    fun getHistoricalLocations(deviceId: String): Flow<List<LocationHistoryItem>> = callbackFlow {
        val query = devicesCollection.document(deviceId)
            .collection("location_history")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .limit(50)

        val subscription = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null) {
                val list = snapshot.documents.mapNotNull { doc ->
                    val item = doc.toObject(LocationHistoryItem::class.java)
                    item?.id = doc.id
                    item
                }
                trySend(list)
            }
        }
        awaitClose { subscription.remove() }
    }
}
