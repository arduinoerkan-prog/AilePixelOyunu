package com.ailepixel.oyunu;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.*;
import android.view.*;
import android.content.*;

public class MainActivity extends Activity {
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        setContentView(new GameView(this));
    }
}
class GameView extends View {
    Paint p=new Paint(); float x=120,y=500; int hero=0;
    String[] names={"BABA","ANNE","ÇOCUK"};
    GameView(Context c){super(c); p.setTypeface(Typeface.MONOSPACE); setFocusable(true);}
    void box(Canvas c,int color,float l,float t,float r,float b){p.setColor(color);p.setStyle(Paint.Style.FILL);c.drawRect(l,t,r,b,p);}
    void txt(Canvas c,String s,float x,float y,float size){p.setColor(Color.WHITE);p.setTextSize(size);p.setTypeface(Typeface.DEFAULT_BOLD);c.drawText(s,x,y,p);}
    protected void onDraw(Canvas c){
        int w=getWidth(),h=getHeight();
        box(c,Color.rgb(25,32,65),0,0,w,h);
        box(c,Color.rgb(76,105,75),0,h*.45f,w,h);
        box(c,Color.rgb(42,42,75),0,h*.45f,w,h*.46f);
        // HUD
        box(c,Color.rgb(18,18,35),0,0,w,h*.12f);
        txt(c,"AİLE PIXEL MACERASI",20,42,25);
        txt(c,"♥♥♥   ★ 012",20,78,20);
        txt(c,names[hero],w-125,45,18);
        // simple pixel family character
        float cy=y;
        int body=hero==0?Color.rgb(55,90,160):hero==1?Color.rgb(190,80,120):Color.rgb(235,175,55);
        box(c,Color.rgb(245,205,165),x,cy-55,x+38,cy-17);
        box(c,body,x-4,cy-17,x+42,cy+35);
        box(c,Color.BLACK,x+7,cy-43,x+12,cy-38);
        box(c,Color.BLACK,x+25,cy-43,x+30,cy-38);
        box(c,body,x-14,cy+35,x+2,cy+43);
        box(c,body,x+27,cy+35,x+43,cy+43);
        // picnic goal
        txt(c,"★",w-105,h*.40f,45); txt(c,"PİKNİK",w-120,h*.48f,16);
        txt(c,"BABA   ANNE   ÇOCUK",20,h-105,18);
        txt(c,"◀     ●     ▶",20,h-58,32);
        txt(c,"▲  Zıpla     ✦  Değiştir",w/2-100,h-58,17);
        invalidate();
    }
    public boolean onTouchEvent(android.view.MotionEvent e){
        if(e.getAction()!=MotionEvent.ACTION_DOWN && e.getAction()!=MotionEvent.ACTION_MOVE)return true;
        float tx=e.getX(), ty=e.getY(); int w=getWidth(),h=getHeight();
        if(ty>h*.72f){
            if(tx<w*.28f)x-=14;
            else if(tx<w*.52f)x+=14;
            else if(tx>w*.78f)hero=(hero+1)%3;
            if(tx>w*.52f && tx<w*.78f)y=Math.max(h*.35f,y-90);
        } else { x += (tx>w/2?18:-18); }
        x=Math.max(20,Math.min(w-65,x));
        y=Math.min(h*.65f,y+4);
        return true;
    }
}
