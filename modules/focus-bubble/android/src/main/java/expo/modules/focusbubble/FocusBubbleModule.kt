package expo.modules.focusbubble

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FocusBubbleModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  override fun definition() = ModuleDefinition {
    Name("FocusBubble")
    Events("onStateChanged")
    OnCreate { FloatingBubbleService.listener = { sendEvent("onStateChanged", mapOf("state" to it)) } }
    OnDestroy { FloatingBubbleService.listener = null }
    Function("hasPermission") { Settings.canDrawOverlays(appContext.reactContext!!) }
    Function("requestPermission") {
      val activity = appContext.currentActivity ?: throw IllegalStateException("Open the app to grant permission")
      main.post { activity.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${activity.packageName}"))) }
    }
    AsyncFunction("showBubble") { data: Map<String, Any?> ->
      val context = appContext.reactContext!!
      if (!Settings.canDrawOverlays(context)) throw SecurityException("Overlay permission is required")
      if (appContext.currentActivity == null) throw IllegalStateException("Start your bubble while the app is visible")
      val intent = Intent(context, FloatingBubbleService::class.java).putExtra("data", org.json.JSONObject(data).toString())
      context.startForegroundService(intent)
      Unit
    }
    AsyncFunction("updateBubble") { data: Map<String, Any?> ->
      val service = FloatingBubbleService.instance
      service?.onUpdate(org.json.JSONObject(data))
    }
    AsyncFunction("hideBubble") { FloatingBubbleService.instance?.hide() }
    AsyncFunction("stop") { FloatingBubbleService.instance?.stopSelf() }
    Function("expandBubble") { main.post { FloatingBubbleService.instance?.overlay?.expand() }; Unit }
    Function("collapseBubble") { main.post { FloatingBubbleService.instance?.overlay?.collapse() }; Unit }
    Function("resetPosition") { appContext.reactContext!!.getSharedPreferences("bubble",0).edit().remove("x").remove("y").apply(); main.post { FloatingBubbleService.instance?.overlay?.reset() }; Unit }
    Function("getBubbleState") { mapOf("visible" to (FloatingBubbleService.instance?.overlay?.visible ?: false), "data" to FloatingBubbleService.instance?.data?.toString()) }
    Function("consumeState") {
      val prefs = appContext.reactContext!!.getSharedPreferences("bubble",0)
      val pending = FloatingBubbleService.instance?.snapshot() ?: prefs.getString("pending",null)
      prefs.edit().remove("pending").apply()
      pending
    }
  }
}
