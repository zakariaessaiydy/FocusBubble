package expo.modules.focusbubble

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.*
import android.provider.Settings
import org.json.JSONObject
import kotlin.math.*

class FloatingBubbleService : Service() {
  companion object { var instance: FloatingBubbleService? = null; var listener: ((String) -> Unit)? = null }
  lateinit var overlay: BubbleOverlayManager
  var data = JSONObject()
  private val handler = Handler(Looper.getMainLooper())
  private var anchorMono = 0L
  private var baseElapsed = 0.0
  private val tick = object : Runnable {
    override fun run() {
      if (!Settings.canDrawOverlays(this@FloatingBubbleService)) { hide(); stopSelf(); return }
      val seconds = elapsed()
      if (data.optString("status") == "running" && data.optString("mode") != "stopwatch" && seconds >= data.optDouble("plannedDuration",1500.0)) {
        data.put("actualDuration",data.optDouble("plannedDuration")).put("status","completed").put("anchorAt",System.currentTimeMillis())
        publish(); notification(true); overlay.destroy(); stopSelf(); return
      }
      overlay.update(data, seconds)
      handler.postDelayed(this,1000)
    }
  }
  override fun onCreate() { super.onCreate(); instance=this; overlay=BubbleOverlayManager(this); getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel("focus-bubble","Active focus",NotificationManager.IMPORTANCE_LOW)) }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val raw=intent?.getStringExtra("data") ?: return START_NOT_STICKY
    onUpdate(JSONObject(raw))
    val note=buildNotification(false)
    if(Build.VERSION.SDK_INT>=34) startForeground(812,note,ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE) else startForeground(812,note)
    try { overlay.show(data); handler.removeCallbacks(tick); handler.post(tick) } catch (e: Exception) { data.put("error",e.message); publish(); stopSelf() }
    return START_NOT_STICKY
  }
  fun onUpdate(value: JSONObject) {
    val update = { data=value; baseElapsed=value.optDouble("actualDuration",0.0)+if(value.optString("status")=="running") max(0.0,(System.currentTimeMillis()-value.optLong("anchorAt",System.currentTimeMillis()))/1000.0) else 0.0; anchorMono=SystemClock.elapsedRealtime(); if(::overlay.isInitialized) overlay.update(data,elapsed()); notification(false) }
    if(Looper.myLooper()==Looper.getMainLooper()) update() else handler.post { update() }
  }
  fun snapshot(): String = JSONObject(data.toString()).put("actualDuration",elapsed()).put("anchorAt",System.currentTimeMillis()).toString()
  fun elapsed(): Double = baseElapsed + if(data.optString("status")=="running") (SystemClock.elapsedRealtime()-anchorMono)/1000.0 else 0.0
  fun toggle() { val running=data.optString("status")=="running"; baseElapsed=elapsed(); anchorMono=SystemClock.elapsedRealtime(); data.put("actualDuration",baseElapsed).put("anchorAt",System.currentTimeMillis()).put("status",if(running) "paused" else "running"); publish(); notification(false) }
  fun finish() { data.put("actualDuration",elapsed()).put("anchorAt",System.currentTimeMillis()).put("status","completed");publish();notification(true);stopSelf() }
  fun hide() { handler.post { overlay.destroy() } }
  override fun onConfigurationChanged(config: android.content.res.Configuration) { super.onConfigurationChanged(config); overlay.reflow() }
  fun publish() { getSharedPreferences("bubble",0).edit().putString("pending",data.toString()).apply(); listener?.invoke(data.toString()) }
  fun openApp() {
    val intent=Intent(Intent.ACTION_VIEW,android.net.Uri.parse("focusbubble://goal/${data.optString("goalId")}")).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    try {startActivity(intent)} catch(_:Exception) {packageManager.getLaunchIntentForPackage(packageName)?.let {it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(it)}}
  }
  private fun buildNotification(done: Boolean): Notification {
    val intent=packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    val pending=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val b=Notification.Builder(this,"focus-bubble").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(if(done) "A little closer. Well done!" else data.optString("title","Your focus"))
      .setContentText(if(done) "Your session is saved when you return." else if(data.optString("status")=="paused") "Focus paused" else "Your goal is always in sight")
      .setContentIntent(pending).setOngoing(!done).setOnlyAlertOnce(true)
    if(!done && data.optString("status")=="running") { val countDown=data.optString("mode")!="stopwatch"; b.setUsesChronometer(true).setChronometerCountDown(countDown).setWhen(if(countDown) System.currentTimeMillis()+((data.optDouble("plannedDuration")-elapsed())*1000).toLong() else System.currentTimeMillis()-(elapsed()*1000).toLong()) }
    return b.build()
  }
  private fun notification(done: Boolean) { getSystemService(NotificationManager::class.java).notify(if(done) 813 else 812,buildNotification(done)) }
  override fun onDestroy() { handler.removeCallbacksAndMessages(null); overlay.destroy(); instance=null; super.onDestroy() }
  override fun onBind(intent: Intent?) = null
}
