package expo.modules.focusbubble

import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.view.*
import android.widget.*
import org.json.JSONObject
import kotlin.math.*

class BubbleOverlayManager(private val service: FloatingBubbleService) {
  private val wm=service.getSystemService(WindowManager::class.java)
  private val prefs=service.getSharedPreferences("bubble",0)
  private var bubble: BubbleTimerView?=null
  private var panel: LinearLayout?=null
  private var timer: TextView?=null
  private var toggleButton: Button?=null
  private var dismissTarget: TextView?=null
  private var config=JSONObject()
  private var lastTap=0L
  var visible=false; private set
  private val params=WindowManager.LayoutParams(200,200,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT).apply { gravity=Gravity.TOP or Gravity.LEFT }
  private fun dp(value: Int)=(value*service.resources.displayMetrics.density).toInt()
  private fun bounds(): android.graphics.Rect {
    if(android.os.Build.VERSION.SDK_INT<30) { val metrics=service.resources.displayMetrics;return android.graphics.Rect(0,dp(28),metrics.widthPixels,metrics.heightPixels-dp(48)) }
    val metrics=wm.currentWindowMetrics; val inset=metrics.windowInsets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout());return android.graphics.Rect(inset.left,inset.top,metrics.bounds.width()-inset.right,metrics.bounds.height()-inset.bottom)
  }
  private fun clamp() { val b=bounds();params.x=params.x.coerceIn(b.left,max(b.left,b.right-params.width));params.y=params.y.coerceIn(b.top,max(b.top,b.bottom-params.height)) }
  fun show(data: JSONObject) {
    if(visible) {update(data,service.elapsed());return}; config=data
    val size=dp(data.optInt("size",68).coerceIn(56,88));params.width=size;params.height=size
    params.x=prefs.getInt("x",bounds().right-size);params.y=prefs.getInt("y",dp(180));clamp()
    val view=BubbleTimerView(service);view.alpha=data.optDouble("opacity",1.0).toFloat().coerceIn(0.35f,1f);view.elevation=dp(8).toFloat()
    bubble=view;wm.addView(view,params);visible=true
    var downX=0f;var downY=0f;var x=0;var y=0;var downAt=0L;var moved=false
    view.setOnTouchListener { _, event ->
      when(event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {downX=event.rawX;downY=event.rawY;x=params.x;y=params.y;downAt=System.currentTimeMillis();moved=false;true}
        MotionEvent.ACTION_MOVE -> {if(hypot((event.rawX-downX).toDouble(),(event.rawY-downY).toDouble())>dp(6)){if(!moved){if(config.optBoolean("haptics",true))view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);showDismiss()};moved=true;collapse();params.x=x+(event.rawX-downX).toInt();params.y=y+(event.rawY-downY).toInt();clamp();wm.updateViewLayout(view,params)};true}
        MotionEvent.ACTION_UP -> {hideDismiss();if(moved){if(params.y+params.height>bounds().bottom-dp(100)){service.hide()}else{snapToEdge()}}else if(System.currentTimeMillis()-downAt>550){expand(true)}else{val now=System.currentTimeMillis();if(now-lastTap<300&&config.optBoolean("doubleTap",true)){service.toggle();collapse()}else if(panel==null)expand() else collapse();lastTap=now};view.performClick();true}
        MotionEvent.ACTION_CANCEL -> {hideDismiss();true}
        else -> false
      }
    }
    view.addOnLayoutChangeListener { _,_,_,_,_,_,_,_,_ -> if(visible){clamp()} }
    update(data,service.elapsed())
  }
  fun update(data: JSONObject, seconds: Double) { config=data;bubble?.let { val size=dp(data.optInt("size",68).coerceIn(56,88)); if(params.width!=size){params.width=size;params.height=size;clamp();wm.updateViewLayout(it,params)};it.alpha=data.optDouble("opacity",1.0).toFloat().coerceIn(0.35f,1f);it.data=data;it.elapsed=seconds;it.invalidate() };val remaining=if(data.optString("mode")=="stopwatch")seconds else max(0.0,data.optDouble("plannedDuration")-seconds);val s=ceil(remaining).toInt();timer?.text="%02d:%02d".format(s/60,s%60);toggleButton?.text=if(data.optString("status")=="running")"Pause" else "Resume" }
  fun expand(options: Boolean=false) {
    if(panel!=null||!visible)return
    val p=LinearLayout(service).apply {orientation=LinearLayout.VERTICAL;setPadding(dp(20),dp(16),dp(20),dp(16));background=GradientDrawable().apply {setColor(Color.rgb(248,247,255));cornerRadius=dp(24).toFloat()};elevation=dp(12).toFloat()}
    fun text(value: String,size: Float): TextView {val v=TextView(service).apply {text=value;textSize=size;setTextColor(Color.rgb(32,36,58));setPadding(0,dp(5),0,dp(5))};p.addView(v);return v}
    fun button(title: String,action:()->Unit): Button {val b=Button(service).apply{text=title;setOnClickListener{action()}};p.addView(b);return b}
    text("${config.optString("emoji")} ${config.optString("title")}",18f);timer=text("",30f);text(config.optString("step"),13f)
    toggleButton=button(if(config.optString("status")=="running")"Pause" else "Resume"){service.toggle()}
    button("Open goal"){service.openApp();collapse()};button("Hide bubble"){service.hide()}
    if(options)button("Finish focus session"){service.finish()}
    button("Collapse"){collapse()}
    val b=bounds();val width=min(dp(280),b.width());val lp=WindowManager.LayoutParams(width,WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT).apply {gravity=Gravity.TOP or Gravity.LEFT;x=params.x.coerceIn(b.left,max(b.left,b.right-width));y=params.y.coerceIn(b.top,max(b.top,b.bottom-dp(400)))}
    panel=p;wm.addView(p,lp);update(config,service.elapsed())
  }
  fun collapse(){panel?.let {try{wm.removeView(it)}catch(_:Exception){}};panel=null;timer=null;toggleButton=null}
  private fun showDismiss(){if(dismissTarget!=null)return;val target=TextView(service).apply{text="×  Drop here to hide";textSize=16f;setTextColor(Color.WHITE);gravity=Gravity.CENTER;background=GradientDrawable().apply{setColor(Color.rgb(75,62,100));cornerRadius=dp(28).toFloat()}};val p=WindowManager.LayoutParams(dp(220),dp(60),WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,PixelFormat.TRANSLUCENT).apply{gravity=Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL;y=dp(24)};dismissTarget=target;wm.addView(target,p)}
  private fun hideDismiss(){dismissTarget?.let{try{wm.removeView(it)}catch(_:Exception){}};dismissTarget=null}
  fun reset(){params.x=bounds().right-params.width;params.y=dp(180);clamp();bubble?.let{wm.updateViewLayout(it,params)}}
  fun reflow(){collapse();clamp();bubble?.let{wm.updateViewLayout(it,params)}}
  private fun snapToEdge() {
    val target=if(params.x+params.width/2<bounds().centerX())bounds().left else bounds().right-params.width
    prefs.edit().putInt("x",target).putInt("y",params.y).apply()
    if(config.optBoolean("reducedMotion",false)||!android.animation.ValueAnimator.areAnimatorsEnabled()) {params.x=target;reflow();return}
    android.animation.ValueAnimator.ofInt(params.x,target).apply {
      duration=180
      addUpdateListener { animation -> if(visible){params.x=animation.animatedValue as Int;clamp();bubble?.let {wm.updateViewLayout(it,params)}} }
      start()
    }
  }
  fun destroy(){collapse();hideDismiss();bubble?.let{try{wm.removeView(it)}catch(_:Exception){}};bubble=null;visible=false}
}


