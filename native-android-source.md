# Native Android (Kotlin + Jetpack Compose) Source Code

This is the complete source code for a 100% native Android application. To use this, create a new project in **Android Studio** using the **"Empty Compose Activity"** template.

## 1. AndroidManifest.xml
Add these permissions inside the `<manifest>` tag:
```xml
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 2. build.gradle.kts (Module: app)
Ensure you have these dependencies:
```kotlin
dependencies {
    implementation("androidx.compose.material3:material3:1.2.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    implementation("lucide-android:lucide-android:0.400.0") // Or use standard Material Icons
}
```

## 3. MainActivity.kt
This file handles the UI and the Telephony logic.

```kotlin
package com.example.netmonitor

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.telephony.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.delay
import java.util.*

// --- Data Model ---
data class NetworkData(
    val operator: String = "Unknown",
    val technology: String = "Scanning...",
    val cid: String = "N/A",
    val lac: String = "N/A",
    val mcc: String = "N/A",
    val mnc: String = "N/A",
    val rssi: Int = 0,
    val rsrp: Int = 0,
    val rsrq: Int = 0,
    val band: String = "N/A",
    val frequency: String = "N/A",
    val timestamp: String = ""
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(
                primary = Color(0xFF10B981), // Emerald 500
                background = Color.Black,
                surface = Color(0xFF18181B) // Zinc 900
            )) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    NetworkMonitorApp()
                }
            }
        }
    }
}

@Composable
fun NetworkMonitorApp() {
    val context = LocalContext.current
    var networkData by remember { mutableStateOf(NetworkData()) }
    var hasPermission by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasPermission = permissions.values.all { it }
    }

    LaunchedEffect(Unit) {
        val permissions = arrayOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
        if (permissions.all { ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED }) {
            hasPermission = true
        } else {
            permissionLauncher.launch(permissions)
        }
    }

    if (!hasPermission) {
        PermissionScreen { permissionLauncher.launch(arrayOf(Manifest.permission.READ_PHONE_STATE, Manifest.permission.ACCESS_FINE_LOCATION)) }
    } else {
        Dashboard(networkData)
    }

    // Update logic
    LaunchedEffect(hasPermission) {
        if (hasPermission) {
            while (true) {
                networkData = getRealNetworkData(context)
                delay(3000) // Update every 3 seconds
            }
        }
    }
}

@Composable
fun PermissionScreen(onGrant: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(64.dp))
        Spacer(Modifier.height(24.dp))
        Text("Permissions Required", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("This app needs access to phone state and location to read cellular data.", color = Color.Gray)
        Spacer(Modifier.height(32.dp))
        Button(onClick = onGrant, shape = RoundedCornerShape(12.dp)) {
            Text("Grant Access")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Dashboard(data: NetworkData) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(32.dp).background(Color(0xFF10B981), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Settings, null, tint = Color.Black, modifier = Modifier.size(20.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("NetMonitor", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text("Live Tracking", fontSize = 10.sp, color = Color.Gray)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Black)
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp).fillMaxSize()) {
            // Main Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(listOf(Color(0xFF18181B), Color.Black)),
                        RoundedCornerShape(24.dp)
                    )
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("Current Operator", fontSize = 12.sp, color = Color.Gray)
                            Text(data.operator, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                        }
                        Surface(color = Color(0xFF10B981).copy(alpha = 0.1f), shape = RoundedCornerShape(100.dp)) {
                            Text(data.technology, modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp), color = Color(0xFF10B981), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text("Signal Strength", fontSize = 10.sp, color = Color.Gray)
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text(data.rssi.toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                Text(" dBm", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(bottom = 4.dp))
                            }
                            LinearProgressIndicator(
                                progress = { (data.rssi + 120) / 80f },
                                modifier = Modifier.fillMaxWidth().height(4.dp),
                                color = Color(0xFF10B981),
                                trackColor = Color.DarkGray
                            )
                        }
                        Column(Modifier.weight(1f)) {
                            Text("Band / Frequency", fontSize = 10.sp, color = Color.Gray)
                            Text(data.band, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(data.frequency, fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Grid
            LazyVerticalGrid(columns = GridCells.Fixed(2), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item { StatCard(Icons.Default.Place, "Cell ID", data.cid) }
                item { StatCard(Icons.Default.Info, "LAC / TAC", data.lac) }
                item { StatCard(Icons.Default.Public, "MCC / MNC", "${data.mcc} / ${data.mnc}") }
                item { StatCard(Icons.Default.Star, "RSRP / RSRQ", "${data.rsrp} / ${data.rsrq}", Color(0xFF60A5FA)) }
            }
        }
    }
}

@Composable
fun StatCard(icon: ImageVector, label: String, value: String, color: Color = Color(0xFF10B981)) {
    Surface(color = Color(0xFF18181B).copy(alpha = 0.5f), shape = RoundedCornerShape(16.dp), border = androidx.compose.foundation.BorderStroke(1.dp, Color.DarkGray)) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, null, modifier = Modifier.size(14.dp), tint = Color.Gray)
                Spacer(Modifier.width(8.dp))
                Text(label.uppercase(), fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

// --- Telephony Logic ---
fun getRealNetworkData(context: Context): NetworkData {
    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
        return NetworkData(technology = "Permission Denied")
    }

    return try {
        val allCellInfo = telephonyManager.allCellInfo
        if (!allCellInfo.isNullOrEmpty()) {
            val cellInfo = allCellInfo[0]
            when (cellInfo) {
                is CellInfoLte -> {
                    val identity = cellInfo.cellIdentity
                    val signal = cellInfo.cellSignalStrength
                    NetworkData(
                        operator = telephonyManager.networkOperatorName,
                        technology = "4G (LTE)",
                        cid = identity.ci.toString(),
                        lac = identity.tac.toString(),
                        mcc = identity.mccString ?: "N/A",
                        mnc = identity.mncString ?: "N/A",
                        rssi = signal.dbm,
                        rsrp = signal.rsrp,
                        rsrq = signal.rsrq,
                        band = "LTE Band " + getLteBand(identity.earfcn),
                        frequency = "${identity.earfcn} EARFCN",
                        timestamp = Date().toString()
                    )
                }
                // Add similar logic for CellInfoNr (5G) and CellInfoWcdma (3G)
                else -> NetworkData(operator = telephonyManager.networkOperatorName, technology = "Other")
            }
        } else {
            NetworkData(technology = "No Cell Info")
        }
    } catch (e: Exception) {
        NetworkData(technology = "Error: ${e.message}")
    }
}

fun getLteBand(earfcn: Int): String {
    return when {
        earfcn in 0..599 -> "1"
        earfcn in 1200..1949 -> "3"
        earfcn in 6150..6449 -> "20"
        else -> "Unknown"
    }
}
```
