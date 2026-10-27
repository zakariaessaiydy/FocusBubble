package expo.modules.focusbubble

import android.content.Context
import android.graphics.*
import android.view.View
import org.json.JSONObject
import kotlin.math.*

class BubbleTimerView(context: Context) : View(context) {
  private val paint=Paint(Paint.ANTI_ALIAS_FLAG)
  var data=JSONObject()
  var elapsed=0.0
  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val center=width/2f; val radius=center-5
    val color=try { Color.parseColor(data.optString("color","#7C5CFC")) } catch(e:Exception) { Color.rgb(124,92,252) }
    paint.style=Paint.Style.FILL; paint.color=color; canvas.drawCircle(center,center,radius,paint)
    paint.style=Paint.Style.STROKE; paint.strokeWidth=4f; paint.color=0x55FFFFFF; canvas.drawCircle(center,center,radius-5,paint)
    paint.color=Color.WHITE;paint.strokeCap=Paint.Cap.ROUND
    val planned=data.optDouble("plannedDuration",1500.0);val ratio=if(data.optString("mode")=="stopwatch") (elapsed%3600)/3600 else min(1.0,elapsed/max(1.0,planned))
    canvas.drawArc(10f,10f,width-10f,height-10f,-90f,(ratio*360).toFloat(),false,paint)
    paint.style=Paint.Style.FILL;paint.textAlign=Paint.Align.CENTER;paint.typeface=Typeface.create("sans-serif",Typeface.BOLD);paint.textSize=width*0.29f
    canvas.drawText(data.optString("emoji","🎯"),center,center-2,paint)
    val seconds=if(data.optString("mode")=="stopwatch")elapsed else max(0.0,planned-elapsed)
    val s=ceil(seconds).toInt();val time="%02d:%02d".format(s/60,s%60)
    paint.textSize=width*0.18f;canvas.drawText(time,center,center+width*0.24f,paint)
    contentDescription="${data.optString("title")}, $time, ${data.optString("status")}. Tap for controls."
  }
}
