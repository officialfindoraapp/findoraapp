package com.findora.app.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.provider.Settings
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.findora.app.R
import com.findora.app.data.repository.DeviceRepository
import com.findora.app.ui.viewmodel.FindoraViewModel
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var viewModel: FindoraViewModel
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var auth: FirebaseAuth
    private var locationCallback: LocationCallback? = null
    
    private val deviceId = "android_pixel_emulator" // Unique device ID binding

    // Handle background location permission request result
    private val requestBackgroundPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            Toast.makeText(this, "Background location permission granted.", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Background tracking is disabled. Findora will only track in the foreground.", Toast.LENGTH_LONG).show()
        }
        startLocationUpdates()
    }

    // Handle fine/coarse permission request results
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        
        if (fineGranted || coarseGranted) {
            Toast.makeText(this, "Location permission granted. Verifying background tracking...", Toast.LENGTH_SHORT).show()
            checkBackgroundPermissionAndStart()
        } else {
            showPermissionDeniedDialog()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize Firebase services
        auth = FirebaseAuth.getInstance()
        val db = FirebaseFirestore.getInstance()
        val repo = DeviceRepository(db)
        viewModel = FindoraViewModel(repo)

        // Location setup
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // UI Setup
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        setupNavigation(bottomNav)

        // Observe tracking details
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.startTrackingDevice(deviceId)
            }
        }

        // Request appropriate tracking and notification permissions
        checkAndRequestPermissions()
    }

    private fun setupNavigation(bottomNav: BottomNavigationView) {
        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    // Navigate to HomeFragment
                    true
                }
                R.id.nav_map -> {
                    // Navigate to LiveMapFragment
                    true
                }
                R.id.nav_history -> {
                    // Navigate to HistoryFragment
                    true
                }
                R.id.nav_profile -> {
                    // Navigate to ProfileFragment
                    true
                }
                R.id.nav_settings -> {
                    // Navigate to SettingsFragment
                    true
                }
                else -> false
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needsRequest = permissions.any {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needsRequest) {
            requestPermissionLauncher.launch(permissions.toTypedArray())
        } else {
            checkBackgroundPermissionAndStart()
        }
    }

    private fun checkBackgroundPermissionAndStart() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val bgGranted = ContextCompat.checkSelfPermission(
                this, 
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            
            if (!bgGranted) {
                AlertDialog.Builder(this)
                    .setTitle("Background Location Required")
                    .setMessage("To protect this device continuously, Findora requires permission to access location in the background (even when the app is closed or the screen is off). Please choose 'Allow all the time' on the next screen.")
                    .setPositiveButton("Grant") { _, _ ->
                        requestBackgroundPermissionLauncher.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                    }
                    .setNegativeButton("Keep Foreground Only") { _, _ ->
                        Toast.makeText(this, "Background tracking is disabled.", Toast.LENGTH_SHORT).show()
                        startLocationUpdates()
                    }
                    .setCancelable(false)
                    .show()
            } else {
                startLocationUpdates()
            }
        } else {
            startLocationUpdates()
        }
    }

    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("Permission Required")
            .setMessage("Findora requires accurate location permission to retrieve GPS telemetry from this device. Please grant location permissions in App Settings to proceed.")
            .setPositiveButton("Retry") { _, _ ->
                checkAndRequestPermissions()
            }
            .setNegativeButton("Exit") { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }

    private fun checkGpsStatus() {
        val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        if (!isGpsEnabled) {
            AlertDialog.Builder(this)
                .setTitle("Location Services Disabled")
                .setMessage("GPS is currently turned OFF. Findora requires Location Services to track this device accurately in real time. Please enable Location Services in your settings.")
                .setPositiveButton("Enable Settings") { _, _ ->
                    val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                    startActivity(intent)
                }
                .setNegativeButton("Dismiss", null)
                .show()
        }
    }

    private fun startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return
        }

        // Check GPS status
        checkGpsStatus()

        val locationRequest = LocationRequest.create().apply {
            interval = 3000 // Update every 3 seconds
            fastestInterval = 1500 // Max rate 1.5 seconds
            priority = LocationRequest.PRIORITY_HIGH_ACCURACY
            smallestDisplacement = 0f
        }

        // Clean up any existing callbacks
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    location?.let {
                        // Ignore location updates with accuracy worse than 30 meters
                        if (it.hasAccuracy() && it.accuracy > 30f) {
                            return@let
                        }
                        
                        val batteryPct = getBatteryPercentage()
                        val speedVal = if (it.hasSpeed()) it.speed.toDouble() else 0.0
                        val bearingVal = if (it.hasBearing()) it.bearing else 0f
                        
                        viewModel.onLocationCoordinatesUpdated(
                            deviceId = deviceId,
                            latitude = it.latitude,
                            longitude = it.longitude,
                            accuracy = it.accuracy,
                            battery = batteryPct,
                            isOnline = true,
                            speed = speedVal,
                            bearing = bearingVal
                        )
                    }
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
        } catch (unlikely: SecurityException) {
            Toast.makeText(this, "Location permission missing for updates.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getBatteryPercentage(): Int {
        val batteryStatus: Intent? = registerReceiver(
            null, 
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) {
            ((level.toFloat() / scale.toFloat()) * 100).toInt()
        } else {
            100
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }
    }
}
