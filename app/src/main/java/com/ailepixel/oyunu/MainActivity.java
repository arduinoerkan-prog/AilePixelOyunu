package com.ailepixel.oyunu;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.*;
import android.view.*;
import android.content.Context;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;

public class MainActivity extends Activity {
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        setContentView(new GameView(this));
    }
}

class GameView extends View {
    final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
    final Random random = new Random(7);
    final String[] names = {"BABA","ANNE","ÇOCUK"};
    final int[] body = {Color.rgb(55,90,160), Color.rgb(190,80,120), Color.rgb(235,175,55)};
    final ArrayList<Star> stars = new ArrayList<>();
    final ArrayList<Cloud> clouds = new ArrayList<>();

    float px=110, py=0, vy=0;
    int hero=0, lives=3, score=12;
    boolean grounded=false, won=false;
    long last;
    float leftDown=0, rightDown=0;

    GameView(Context c) {
        super(c);
        p.setTypeface(Typeface.MONOSPACE);
        setFocusable(true);
        for(int i=0;i<7;i++) stars.add(new Star(170+i*135, 360+(i%3)*70));
        for(int i=0;i<5;i++) clouds.add(new Cloud(40+i*180, 120+(i%2)*55));
        last=System.currentTimeMillis();
    }

    void rect(Canvas c,int color,float l,float t,float r,float b){
        p.setStyle(Paint.Style.FILL); p.setColor(color); c.drawRect(l,t,r,b,p);
    }
    void text(Canvas c,String s,float x,float y,float size){
        p.setStyle(Paint.Style.FILL); p.setColor(Color.WHITE); p.setTextSize(size);
        p.setTypeface(Typeface.MONOSPACE); c.drawText(s,x,y,p);
    }
    void center(Canvas c,String s,float y,float size){
        p.setTextSize(size); p.setTypeface(Typeface.MONOSPACE);
        float x=(getWidth()-p.measureText(s))/2f; text(c,s,x,y,size);
    }

    @Override protected void onDraw(Canvas c){
        super.onDraw(c);
        int w=getWidth(), h=getHeight();
        long now=System.currentTimeMillis();
        float dt=Math.min(0.035f,(now-last)/1000f); last=now;
        update(dt,w,h);

        // sky / level
        rect(c,Color.rgb(29,35,75),0,0,w,h);
        rect(c,Color.rgb(26,31,67),0,h*.12f,w,h*.48f);
        rect(c,Color.rgb(73,104,73),0,h*.60f,w,h);
        rect(c,Color.rgb(49,68,55),0,h*.60f,w,h*.625f);

        for(Cloud cl:clouds) drawCloud(c,cl.x,cl.y);
        drawStars(c,h);
        drawPicnic(c,w,h);
        drawPlayer(c,h);

        // HUD
        rect(c,Color.rgb(13,13,26),0,0,w,h*.105f);
        text(c,"AİLE PIXEL MACERASI",18,31,16);
        text(c,"♥♥♥",18,58,19);
        text(c,"★ "+String.format("%03d",score),82,58,16);
        text(c,names[hero],w-78,31,12);

        // bottom controls
        rect(c,Color.rgb(10,11,20),0,h*.91f,w,h);
        text(c,"◀",25,h*.955f,30);
        text(c,"●",83,h*.955f,25);
        text(c,"▶",140,h*.955f,30);
        text(c,"▲  ZIPLA",w*.43f,h*.955f,15);
        text(c,"✦ DEĞİŞTİR",w*.70f,h*.955f,13);

        if(won){
            rect(c,0xDD080914,0,h*.25f,w,h*.67f);
            center(c,"PİKNİK TAMAM!",h*.39f,25);
            center(c,"★ "+score+" PUAN ★",h*.45f,18);
            center(c,"DOKUN: YENİDEN OYNA",h*.54f,14);
        }
        invalidate();
    }

    void update(float dt,int w,int h){
        if(won) return;
        if(rightDown>0) px += 210*dt;
        if(leftDown>0) px -= 210*dt;
        vy += 820*dt; py += vy*dt;
        float ground=h*.60f-72;
        if(py>=ground){py=ground;vy=0;grounded=true;} else grounded=false;
        px=Math.max(12,Math.min(w-58,px));

        Iterator<Star> it=stars.iterator();
        while(it.hasNext()){
            Star s=it.next();
            if(Math.abs((px+22)-s.x)<38 && Math.abs((py+28)-s.y)<55){
                score+=10; it.remove();
            }
        }
        if(stars.isEmpty() && px>getWidth()-115) won=true;
    }

    void drawStars(Canvas c,int h){
        p.setColor(Color.WHITE);
        for(Star s:stars){
            Path path=new Path();
            for(int i=0;i<10;i++){
                double a=-Math.PI/2+i*Math.PI/5;
                float r=(i%2==0)?12:5;
                float xx=s.x+(float)Math.cos(a)*r, yy=s.y+(float)Math.sin(a)*r;
                if(i==0) path.moveTo(xx,yy); else path.lineTo(xx,yy);
            }
            path.close(); c.drawPath(path,p);
        }
    }

    void drawCloud(Canvas c,float x,float y){
        p.setColor(0xFFB9C3D9);
        c.drawCircle(x,y,18,p); c.drawCircle(x+22,y-7,24,p);
        c.drawCircle(x+48,y,17,p); c.drawRect(x,y,x+48,y+17,p);
    }

    void drawPicnic(Canvas c,int w,int h){
        float x=w-82, y=h*.60f-28;
        rect(c,Color.rgb(218,74,74),x,y,x+62,y+8);
        for(int i=0;i<5;i++) rect(c,Color.rgb(245,220,180),x+i*12,y+8,x+6+i*12,y+38);
        rect(c,Color.rgb(90,55,35),x+8,y+38,x+13,y+66);
        rect(c,Color.rgb(90,55,35),x+49,y+38,x+54,y+66);
        text(c,"PİKNİK",x-4,y+86,11);
    }

    void drawPlayer(Canvas c,int h){
        float y=py;
        rect(c,Color.rgb(245,205,165),px,y,px+38,y+38);
        rect(c,body[hero],px-4,y+38,px+42,y+88);
        rect(c,Color.BLACK,px+8,y+14,px+13,y+19);
        rect(c,Color.BLACK,px+25,y+14,px+30,y+19);
        rect(c,body[hero],px-12,y+88,px+2,y+96);
        rect(c,body[hero],px+27,y+88,px+43,y+96);
        if(hero==0) rect(c,Color.rgb(45,35,25),px+4,y-3,px+34,y+5);
        if(hero==1) rect(c,Color.rgb(80,35,45),px-1,y-5,px+39,y+4);
    }

    void jump(){
        if(grounded && !won){vy=-420;grounded=false;}
    }
    void reset(){
        px=110; py=0; vy=0; hero=0; lives=3; score=12; won=false;
        stars.clear(); for(int i=0;i<7;i++) stars.add(new Star(170+i*135,360+(i%3)*70));
    }

    @Override public boolean onTouchEvent(MotionEvent e){
        float x=e.getX(), y=e.getY(); int w=getWidth(),h=getHeight();
        if(e.getAction()==MotionEvent.ACTION_DOWN){
            if(won){reset(); return true;}
            if(y>h*.89f){
                if(x<w*.28f) leftDown=1;
                else if(x<w*.43f) rightDown=1;
                else if(x<w*.70f) jump();
                else hero=(hero+1)%3;
            } else {
                if(x<w/2) leftDown=1; else rightDown=1;
            }
        } else if(e.getAction()==MotionEvent.ACTION_UP || e.getAction()==MotionEvent.ACTION_CANCEL){
            leftDown=rightDown=0;
        }
        return true;
    }

    static class Star {float x,y; Star(float a,float b){x=a;y=b;}}
    static class Cloud {float x,y; Cloud(float a,float b){x=a;y=b;}}
}
