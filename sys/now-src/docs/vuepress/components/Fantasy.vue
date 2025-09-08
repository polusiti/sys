<!-- 完全コピー版 (phoneText JSON は Raw から差し替え) -->
<template>
  <div class="fantasy">
    <canvas id="cvs" class="hidden" width="1980" height="1080"></canvas>
    <canvas id="screenImage" class="hidden" width="234" height="357"></canvas>
    <canvas id="rili" class="hidden" width="600" height="600"></canvas>
    <canvas id="display" @click="handleCanvasClick"></canvas>
    <!-- 音声要素を追加 -->
    <audio 
      ref="audioElement" 
      crossorigin="anonymous" 
      loop
      style="display: none;"
    >
      <source src="https://pub-8e44310013c9420d9f803d160de37411.r2.dev/ai-193402.mp3" type="audio/mpeg">
    </audio>
  </div>
</template>

<script>
export default {
  mounted() {
    if (document.getElementsByClassName("fantasy")?.length === 1) {
      this.clearBannerColor();
      if (this.$attrs.index) {
        this.mountedElement();
      }
      this.init();
    }
  },
  methods: {
    init() {
      const cvs = document.getElementById("cvs");
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      const display = document.getElementById("display");
      const displayCtx = display.getContext("2d");
      const screenImage = document.getElementById("screenImage");
      const screenImageCtx = screenImage.getContext("2d");
      const rili = document.getElementById("rili");
      const riliCtx = rili.getContext("2d");

      // 音楽プレイヤー変数を追加
      let isPlaying = false;
      let audioContext;
      let analyser;
      let dataArray;
      let source;
      let isAudioInitialized = false;
      const audioElement = this.$refs.audioElement;

      // 音楽プレイヤーUI設定
      const playerUI = {
        x: 100, y: 950, width: 300, height: 80,
        buttonX: 140, buttonY: 990, buttonRadius: 25
      };

      // 音声初期化関数
      const initAudio = async () => {
        if (isAudioInitialized) return;
        try {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source = audioContext.createMediaElementSource(audioElement);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          isAudioInitialized = true;
        } catch (error) {
          console.error('音声初期化エラー:', error);
        }
      };

      // 音声再生切り替え
      const toggleAudio = async () => {
        if (!isAudioInitialized) await initAudio();
        if (isPlaying) {
          audioElement.pause();
          isPlaying = false;
        } else {
          try {
            await audioElement.play();
            isPlaying = true;
          } catch (error) {
            console.error('再生エラー:', error);
          }
        }
      };

      // クリック処理をthisに割り当て
      this.handleCanvasClick = (event) => {
        const rect = display.getBoundingClientRect();
        const scaleX = 1980 / rect.width;
        const scaleY = 1080 / rect.height;
        const clickX = (event.clientX - rect.left) * scaleX;
        const clickY = (event.clientY - rect.top) * scaleY;
        
        const dx = clickX - playerUI.buttonX;
        const dy = clickY - playerUI.buttonY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= playerUI.buttonRadius) {
          toggleAudio();
        }
      };

      let EnMonth = false;

      function drawRili() {
        riliCtx.clearRect(0, 0, 600, 600);
        const date = new Date();
        const year = date.getYear();
        const mouth = date.getMonth();
        const today = date.getDate();
        const week = date.getDay();
        const cardSize = 40;
        const array_three = [4,6,9,11];
        const array_threeone = [1,3,5,7,8,10,12];
        const array_week = ["SUN","MON","TUES","WED","THUR","FRI","SAT"];
        let firstDraw;
        const wIdx = (today - 1) % 7;
        if (week >= wIdx) firstDraw = week - wIdx; else firstDraw = week - wIdx + 7;
        let countDay = 30;
        if (array_three.indexOf(mouth+1)>-1) countDay = 30;
        else if (array_threeone.indexOf(mouth+1)>-1) countDay = 31;
        else {
          if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) countDay = 29; else countDay = 28;
        }
        const row = 6;

        function drawTodaybg(i,j){
          riliCtx.save();
          for (let k=0;k<5;k++){
            riliCtx.beginPath();
            riliCtx.strokeStyle="#900";
            riliCtx.arc(
              45+i*cardSize*1.7+cardSize/1.18,
              50+j*cardSize+cardSize/2,
              cardSize/2-10+k,
              -Math.PI,
              Math.PI*(1 - k*0.1)
            );
            riliCtx.stroke();
            riliCtx.closePath();
          }
          riliCtx.restore();
        }
        const isNum=/^\d+(\d+)?$/;
        function drawDate(txt,i,j){
          riliCtx.textAlign="center";
            riliCtx.fillStyle="rgb(69,68,84)";
          riliCtx.font=cardSize/1.5+"px Impact";
          const yOff=3;
          if ((j==0||j==6)&&isNum.test(txt)) riliCtx.fillStyle="#900";
          riliCtx.fillText(txt.toString(),
            45+j*cardSize*1.7+cardSize/1.18,
            50+i*cardSize+(cardSize/3)*2+yOff
          );
          if (txt===today) drawTodaybg(j,i);
        }

        riliCtx.fillStyle="rgb(69,68,84)";
        riliCtx.font="900 26pt SimHei";
        riliCtx.textAlign="center";
        const monthCN=["一","二","三","四","五","六","七","八","九","十","十一","十二"];
        const monthEN=[" January","February","  March","  April","   May","  June","  July"," August","September"," October","November"," December"];
        if (EnMonth){
          riliCtx.scale(1.1,1);
          riliCtx.fillText(monthEN[mouth],245,32);
          riliCtx.resetTransform();
        } else {
          riliCtx.scale(1.1,1);
          riliCtx.fillText(monthCN[mouth]+"月",260,32);
          riliCtx.resetTransform();
          riliCtx.font="20pt SimHei";
          riliCtx.textAlign="end";
          riliCtx.fillText(today+"日",520,38);
        }
        for (let i=0;i<row;i++){
          for (let j=0;j<7;j++){
            riliCtx.strokeRect(
              45+j*cardSize*1.7,
              50+i*cardSize,
              cardSize*1.7,
              cardSize
            );
          }
        }
        let dayIndex=1;
        for (let i=0;i<row;i++){
          for (let j=0;j<7;j++){
            if (i==0){ drawDate(array_week[j],i,j); continue; }
            if (i==1 && j<firstDraw) continue;
            if (dayIndex>countDay) break;
            drawDate(dayIndex++,i,j);
          }
        }
      }
      const riliInterval=setInterval(drawRili,3600000);
      drawRili();

      const screenMask=new Image(); screenMask.src=this.$withBase('/fantasy/Screenmask.png');
      const screen=new Image();     screen.src=this.$withBase('/fantasy/screen.png');
      const iv=setInterval(()=>{
        if (screen.complete && screenMask.complete){
          screenImageCtx.drawImage(screen,-300,-50,1280,720);
          screenImageCtx.globalCompositeOperation="destination-atop";
          screenImageCtx.drawImage(screenMask,0,0);
          screenImageCtx.globalCompositeOperation="source-over";
          clearInterval(iv);
        }
      },14);

      window.onresize=()=>{
        display.width=window.innerWidth;
        if (window.innerWidth / window.innerHeight > 1.8333333333333){
          display.height=(window.innerWidth/1980)*1080;
        } else {
          display.height=window.innerHeight;
        }
      };
      window.onresize();

      const bg=new Image(); bg.src=this.$withBase('/fantasy/bg.png');
      const mask=new Image(); mask.src=this.$withBase('/fantasy/mask.png');
      const light=new Image(); light.src=this.$withBase('/fantasy/light.png');
      const caidai=new Image(); caidai.src=this.$withBase('/fantasy/caidai.png');
      const two=new Image(); two.src=this.$withBase('/fantasy/22.png');
      const screenLight=new Image(); screenLight.src=this.$withBase('/fantasy/screenLight.png');
      const phoneLight=new Image(); phoneLight.src=this.$withBase('/fantasy/phoneLight.png');

      const phoneText = JSON.parse(
        // ★ Raw の JSON 配列をそのまま貼り付ける ★
        '[{"time":0,"text":"凌晨啦!"},{"time":6,"text":"早上好!"},{"time":8,"text":"上午好!"},{"time":11,"text":"你吃了吗"},{"time":13,"text":"下午好鸭!"},{"time":16,"text":"摸鱼时光!"},{"time":18,"text":"晚上好!"},{"time":22,"text":"该睡觉啦!"}]'
      );

      const data=new Array(128).fill(0);
      const animData=new Array(128).fill(0);
      let peakValue=1;
      
      // Web Audio API用の音声データ更新関数
      const updateAudioData = () => {
        if (analyser && dataArray && isAudioInitialized && isPlaying) {
          analyser.getByteFrequencyData(dataArray);
          for (let i = 0; i < 64; i++) {
            data[63 - i] = dataArray[i] / 255;
          }
          for (let i = 0; i < 64; i++) {
            data[127 - i] = dataArray[127 - i] || 0;
          }
        }
      };

      // 元のWallpaper Engine用コード
      if (window.wallpaperRegisterAudioListener){
        window.wallpaperRegisterAudioListener(audioData=>{
          let max=0;
          for (let i=0;i<128;i++) if (audioData[i]>max) max=audioData[i];
          peakValue=peakValue*0.99+max*0.01;
          for (let i=0;i<64;i++) data[63-i]=audioData[i]/peakValue;
          for (let i=0;i<64;i++) data[127-i]=audioData[127-i];
        });
      }

      const min=(a,b)=>a>b?b:a;
      const max=(a,b)=>a>b?a:b;

      let targetColor={r:80,g:120,b:169};
      let currentColor={r:80,g:120,b:169};
      let lightColor={r:0,g:34,b:77,a:0};
      const colorToRgb=c=>`rgb(${c.r},${c.g},${c.b})`;
      const colorToRgba=c=>`rgba(${c.r},${c.g},${c.b},${c.a})`;

      let night=false;
      let debug=false;

      const render=()=>{
        // Web Audio APIの音声データを更新
        updateAudioData();

        for (let i=0;i<128;i++){
          animData[i]+=(data[i]-animData[i])*0.3;
          animData[i]=min(animData[i],1);
        }
        ['r','g','b'].forEach(k=>{
          currentColor[k]+=(targetColor[k]-currentColor[k])*0.01;
          currentColor[k]=min(currentColor[k],255);
          currentColor[k]=max(currentColor[k],0);
        });

        ctx.clearRect(0,0,1980,1080);
        ctx.drawImage(bg,0,0);
        ctx.drawImage(mask,954,99);
        ctx.fillStyle="#97adbb";
        ctx.font="32pt Impact";
        ctx.transform(1,2.05*(Math.PI/180),0,1,0,0);
        const time=new Date();
        ctx.fillText(
          (time.getHours()<10?'0':'')+time.getHours()+":"+
          (time.getMinutes()<10?'0':'')+time.getMinutes()+":"+
          (time.getSeconds()<10?'0':'')+time.getSeconds(), 725,318
        );
        ctx.resetTransform();

        ctx.transform(0.9645,0,0,0.96,967,100);
        ctx.rotate(6*(Math.PI/180));
        ctx.drawImage(rili,0,0);
        ctx.resetTransform();
        ctx.transform(0.9645,0,9*(Math.PI/180),1,825,160);
        ctx.rotate(7*(Math.PI/180));

        targetColor = night ? {r:255,g:75,b:80} : {r:80,g:120,b:169};
        ctx.fillStyle="rgba(0,0,0,0.5)";
        ctx.fillRect(-10,320,650,2);
        ctx.fillStyle=colorToRgb(currentColor);
        for (let i=32;i<95;i++){
          ctx.fillRect(10*(i-32),20+(300-300*animData[i]),4,300*animData[i]);
        }
        ctx.resetTransform();

        ctx.globalCompositeOperation="overlay";
        ctx.drawImage(light,971,197);
        ctx.globalCompositeOperation="source-over";
        ctx.drawImage(caidai,949,25);
        ctx.drawImage(two,1319,345);

        if (night && lightColor.a<0.7){
          lightColor.a+=0.005; lightColor.a=min(lightColor.a,0.7);
        } else if (!night) {
          lightColor.a-=0.005; lightColor.a=max(lightColor.a,0);
        }
        if (lightColor.a>0){
          ctx.globalCompositeOperation="hard-light";
          ctx.fillStyle=colorToRgba(lightColor);
          ctx.fillRect(0,0,1980,1080);
          ctx.globalCompositeOperation="source-over";
          ctx.globalAlpha=lightColor.a/0.7;
          ctx.drawImage(phoneLight,860,437);
          ctx.globalAlpha=1;
        }

        ctx.drawImage(screenImage,0,0);
        if (lightColor.a>0){
          ctx.globalAlpha=lightColor.a/0.7;
          ctx.drawImage(screenLight,0,0);
          ctx.globalAlpha=1;
        }

        night=true;
        let greeting="凌晨啦!";
        phoneText.forEach(v=>{
          if (time.getHours() >= v.time) greeting=v.text;
        });
        if (time.getHours() >= 6 && time.getHours() <= 18) night=false;
        night = debug ? !night : night;

        ctx.fillStyle="#000";
        ctx.font="31.02pt SimHei";
        ctx.transform(1.0911,-35*(Math.PI/180),0,0.5868,1132.94,564.07);
        ctx.rotate(56.5*(Math.PI/180));
        ctx.textAlign="center";
        ctx.fillStyle="#fff";
        ctx.fillText(greeting,135,100);
        ctx.textAlign="start";
        ctx.resetTransform();

        // 音楽プレイヤーUI描画を追加
        ctx.fillStyle="rgba(0,0,0,0.7)";
        ctx.fillRect(playerUI.x, playerUI.y, playerUI.width, playerUI.height);
        ctx.strokeStyle="#ffffff";
        ctx.lineWidth=3;
        ctx.strokeRect(playerUI.x, playerUI.y, playerUI.width, playerUI.height);

        // 再生ボタン
        ctx.fillStyle=isPlaying?"#ff6b6b":"#4ecdc4";
        ctx.beginPath();
        ctx.arc(playerUI.buttonX, playerUI.buttonY, playerUI.buttonRadius, 0, 2*Math.PI);
        ctx.fill();

        // ボタンアイコン
        ctx.fillStyle="#ffffff";
        if (isPlaying) {
          ctx.fillRect(playerUI.buttonX-10, playerUI.buttonY-10, 20, 20);
        } else {
          ctx.beginPath();
          ctx.moveTo(playerUI.buttonX-8, playerUI.buttonY-12);
          ctx.lineTo(playerUI.buttonX-8, playerUI.buttonY+12);
          ctx.lineTo(playerUI.buttonX+12, playerUI.buttonY);
          ctx.closePath();
          ctx.fill();
        }

        // テキスト表示
        ctx.fillStyle="#ffffff";
        ctx.font="24pt Arial";
        ctx.fillText("🎵 Background Music", playerUI.x+80, playerUI.buttonY-15);
        ctx.font="18pt Arial";
        ctx.fillStyle="#cccccc";
        ctx.fillText(isPlaying?"♪ Playing...":"Click to play", playerUI.x+80, playerUI.buttonY+15);

        displayCtx.drawImage(cvs,0,0,display.width,display.height);
        window.requestAnimationFrame(render);
      };
      window.requestAnimationFrame(render);
    },
    handleCanvasClick(event) {
      // この関数はinit内で動的に設定される
    },
    mountedElement() {
      const fantasy=document.getElementsByClassName("fantasy")[0];
      const banner=document.getElementsByClassName("banner")[0];
      if (banner){
        banner.style.background="none";
        fantasy && banner.appendChild(fantasy);
      }
    },
    clearBannerColor() {
      const bannerColor=document.getElementsByClassName("banner-color")[0];
      if (bannerColor && bannerColor.parentNode){
        bannerColor.parentNode.removeChild(bannerColor);
      }
    }
  }
};
</script>

<style>
.fantasy {
  position: fixed;
  top:0;
  height:100vh;
  width:100%;
  z-index:-9;
}
.hidden { display:none; }
#display { margin:auto; }
</style>
