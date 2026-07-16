package com.findora.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.findora.app.data.model.Device
import com.findora.app.data.model.LocationHistoryItem
import com.findora.app.data.repository.DeviceRepository
import com.google.firebase.Timestamp
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

class FindoraViewModel(private val repository: DeviceRepository) : ViewModel() {

    private val _deviceState = MutableStateFlow<Device?>(null)
    val deviceState: StateFlow<Device?> = _deviceState.asStateFlow()

    private val _historyState = MutableStateFlow<List<LocationHistoryItem>>(emptyList())
    val historyState: StateFlow<List<LocationHistoryItem>> = _historyState.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    /**
     * Connects real-time streams for device updates and historical trails.
     */
    fun startTrackingDevice(deviceId: String) {
        _isLoading.value = true
        viewModelScope.launch {
            repository.observeDevice(deviceId)
                .catch { exception ->
                    _errorMessage.value = "Failed to stream device details: ${exception.message}"
                }
                .collect { device ->
                    _deviceState.value = device
                    _isLoading.value = false
                }
        }

        viewModelScope.launch {
            repository.getHistoricalLocations(deviceId)
                .catch { exception ->
                    _errorMessage.value = "Failed to stream tracking history: ${exception.message}"
                }
                .collect { history ->
                    _historyState.value = history
                }
        }
    }

    /**
     * Triggers active coordinate update and records historical trace.
     */
    fun onLocationCoordinatesUpdated(
        deviceId: String, 
        latitude: Double, 
        longitude: Double, 
        accuracy: Float,
        battery: Int,
        isOnline: Boolean,
        speed: Double,
        bearing: Float
    ) {
        viewModelScope.launch {
            try {
                repository.updateLiveLocation(deviceId, latitude, longitude, accuracy, battery, isOnline, speed, bearing)
            } catch (e: Exception) {
                _errorMessage.value = "Error updating database: ${e.message}"
            }
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }
}
