# Native Android Bridge Implementation

To get real cellular data in your APK, follow these steps in your Android Studio project.

## 1. Update AndroidManifest.xml
Add these permissions inside the `<manifest>` tag:
```xml
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 2. Create the Capacitor Plugin (Kotlin)
Create a file named `CellularMonitorPlugin.kt` in your `android/app/src/main/java/.../` directory:

```kotlin
package com.yourname.cellmonitor

import android.content.Context
import android.telephony.*
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "CellularMonitor")
class CellularMonitorPlugin : Plugin() {

    @PluginMethod
    fun getCellInfo(call: PluginCall) {
        val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val info = JSObject()

        try {
            val allCellInfo = telephonyManager.allCellInfo
            if (allCellInfo != null && allCellInfo.isNotEmpty()) {
                val cellInfo = allCellInfo[0] // Get primary cell

                info.put("operator", telephonyManager.networkOperatorName)
                
                when (cellInfo) {
                    is CellInfoLte -> {
                        info.put("technology", "4G (LTE)")
                        info.put("cid", cellInfo.cellIdentity.ci.toString())
                        info.put("lac", cellInfo.cellIdentity.tac.toString())
                        info.put("mcc", cellInfo.cellIdentity.mccString)
                        info.put("mnc", cellInfo.cellIdentity.mncString)
                        info.put("rsrp", cellInfo.cellSignalStrength.rsrp)
                        info.put("rsrq", cellInfo.cellSignalStrength.rsrq)
                        info.put("rssi", cellInfo.cellSignalStrength.dbm)
                        info.put("band", "LTE Band " + getLteBand(cellInfo.cellIdentity.earfcn))
                    }
                    is CellInfoNr -> {
                        info.put("technology", "5G (NR)")
                        // Note: NR requires API 29+
                        val identity = cellInfo.cellIdentity as CellIdentityNr
                        info.put("cid", identity.nci.toString())
                        info.put("lac", identity.tac.toString())
                        info.put("mcc", identity.mccString)
                        info.put("mnc", identity.mncString)
                        info.put("band", "n" + identity.nrarfcn)
                    }
                }
            }
            call.resolve(info)
            
            // Also trigger the window event for the React side
            bridge.triggerWindowJSEvent("nativeNetworkUpdate", info.toString())
            
        } catch (e: Exception) {
            call.reject("Error accessing telephony: ${e.message}")
        }
    }

    private fun getLteBand(earfcn: Int): String {
        return when {
            earfcn in 0..599 -> "1"
            earfcn in 1200..1949 -> "3"
            earfcn in 6150..6449 -> "20"
            else -> "Unknown"
        }
    }
}
```

## 3. Register the Plugin in MainActivity.kt
```kotlin
package com.yourname.cellmonitor

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        registerPlugin(CellularMonitorPlugin::class.java)
    }
}
```

## 4. Usage in React
The `App.tsx` is already configured to listen for the `nativeNetworkUpdate` event. When you run this in your APK, the Kotlin code will push real data directly into your dashboard.
