import { useEffect, useRef } from 'react'

interface Particle {
  x:number; y:number; vx:number; vy:number; baseVx:number; baseVy:number
  size:number; opacity:number; maxOp:number; phase:number; speed:number
  color:string; type:'dot'|'ring'|'cross'|'paw'; boost:number
}
interface Nebula  { x:number; y:number; r:number; c:string; op:number; phase:number }
interface Pulse   { x:number; y:number; radius:number; maxR:number; life:number; color:string; born:number }


interface Meteor {
  x: number; y: number     // start position
  vx: number; vy: number   // direction (normalized * speed)
  life: number             // 0→1 fade
  maxLife: number          // frames alive
  frame: number
  length: number           // trail length px
  color: string
}

const COLORS=['rgba(155,48,255,','rgba(255,45,155,','rgba(0,245,255,','rgba(255,229,102,','rgba(191,95,255,']
const PULSE_COLORS=['rgba(155,48,255,','rgba(155,48,255,','rgba(255,45,155,','rgba(0,245,255,']

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({x:-999,y:-999})
  const partsRef  = useRef<Particle[]>([])
  const nebRef    = useRef<Nebula[]>([])
  const pulseRef  = useRef<Pulse[]>([])
  const frameRef  = useRef(0)
  const meteorRef  = useRef<Meteor[]>([])
  const lastMeteor  = useRef(0)
  const lastPulse = useRef(0)

  useEffect(()=>{
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!

    const resize = ()=>{
      canvas.width = window.innerWidth
      canvas.height= window.innerHeight
      buildNebulae()
    }

    const buildNebulae = ()=>{
      nebRef.current=[
        {x:canvas.width*.10,y:canvas.height*.15,r:450,c:'rgba(155,48,255,',op:0.07,phase:0},
        {x:canvas.width*.85,y:canvas.height*.75,r:360,c:'rgba(255,45,155,', op:0.05,phase:2.1},
        {x:canvas.width*.50,y:canvas.height*.50,r:620,c:'rgba(155,48,255,', op:0.03,phase:1.2},
        {x:canvas.width*.70,y:canvas.height*.10,r:290,c:'rgba(0,245,255,',  op:0.04,phase:3.5},
        {x:canvas.width*.20,y:canvas.height*.85,r:330,c:'rgba(107,16,207,', op:0.05,phase:0.8},
      ]
    }

    resize()
    window.addEventListener('resize',resize)

    // Particles
    const count=Math.min(120,Math.floor(window.innerWidth/14))
    partsRef.current=Array.from({length:count},(_,i)=>{
      const type:Particle['type']=i%18===0?'ring':i%28===0?'cross':i%40===0?'paw':'dot'
      const maxOp=type==='dot'?Math.random()*.42+.05:Math.random()*.28+.06
      const bvx=(Math.random()-.5)*.35; const bvy=(Math.random()-.5)*.28
      return{
        x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
        vx:bvx,vy:bvy,baseVx:bvx,baseVy:bvy,
        size:type==='dot'?Math.random()*2.5+.4:type==='ring'?Math.random()*9+4:Math.random()*6+2,
        opacity:Math.random()*maxOp,maxOp,
        phase:Math.random()*Math.PI*2,speed:Math.random()*.014+.004,
        color:COLORS[Math.floor(Math.random()*COLORS.length)],type,boost:0,
      }
    })

    const onMouse=(e:MouseEvent)=>{mouseRef.current={x:e.clientX,y:e.clientY}}
    window.addEventListener('mousemove',onMouse)


    const spawnMeteor = () => {
      const angle  = (200 + Math.random() * 50) * Math.PI / 180  // ~SW direction
      const speed  = 8 + Math.random() * 12
      const startX = Math.random() * canvas.width * 1.2
      const startY = -20
      const MCOLS  = ['rgba(155,48,255,','rgba(255,45,155,','rgba(0,245,255,']
      meteorRef.current.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, maxLife: 40 + Math.floor(Math.random() * 30),
        frame: 0,
        length: 80 + Math.random() * 140,
        color: MCOLS[Math.floor(Math.random() * MCOLS.length)],
      })
    }

    // ── Spawn a radar pulse ─────────────────────────────────────
    const spawnPulse=(ts:number)=>{
      // Pulse origins: slightly off-center for organic feel
      const origins=[
        {x:canvas.width*.5,  y:canvas.height*.45},
        {x:canvas.width*.18, y:canvas.height*.3 },
        {x:canvas.width*.82, y:canvas.height*.6 },
        {x:canvas.width*.4,  y:canvas.height*.7 },
        {x:canvas.width*.65, y:canvas.height*.2 },
      ]
      const o=origins[Math.floor(Math.random()*origins.length)]
      // Add slight jitter
      const x=o.x+(Math.random()-.5)*canvas.width*.15
      const y=o.y+(Math.random()-.5)*canvas.height*.15
      const maxR=Math.min(canvas.width,canvas.height)*(0.35+Math.random()*.35)
      pulseRef.current.push({
        x,y,radius:0,maxR,life:1,
        color:PULSE_COLORS[Math.floor(Math.random()*PULSE_COLORS.length)],
        born:ts,
      })
    }

    // ── Draw one pulse ring ─────────────────────────────────────
    const drawPulse=(p:Pulse)=>{
      const t    = p.radius/p.maxR        // 0→1 progress
      const alpha= p.life*(1-Math.pow(t,.6))*.35  // fade out toward edge
      if(alpha<.005) return

      // Outer glow halo
      const grad=ctx.createRadialGradient(p.x,p.y,Math.max(0,p.radius-20),p.x,p.y,p.radius+8)
      grad.addColorStop(0,   `${p.color}0)`)
      grad.addColorStop(0.5, `${p.color}${alpha*.4})`)
      grad.addColorStop(0.8, `${p.color}${alpha})`)
      grad.addColorStop(1,   `${p.color}0)`)
      ctx.fillStyle=grad
      ctx.beginPath()
      ctx.arc(p.x,p.y,p.radius+8,0,Math.PI*2)
      if(p.radius>20) {
        ctx.arc(p.x,p.y,Math.max(0,p.radius-20),0,Math.PI*2,true)
      }
      ctx.fill()

      // Crisp ring line
      ctx.save()
      ctx.globalAlpha=alpha*1.8
      ctx.strokeStyle=`${p.color}1)`
      ctx.lineWidth=1.2
      ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.stroke()
      ctx.restore()
    }

    // ── Main loop ───────────────────────────────────────────────
    const draw=(ts:number)=>{
      ctx.clearRect(0,0,canvas.width,canvas.height)
      const mouse=mouseRef.current

      // 1. Nebulae
      nebRef.current.forEach(n=>{
        n.phase+=.0018
        const px=n.x+Math.sin(n.phase)*70; const py=n.y+Math.cos(n.phase*.7)*50
        const op=n.op*(0.75+0.25*Math.sin(ts*.0005+n.phase))
        const g=ctx.createRadialGradient(px,py,0,px,py,n.r)
        g.addColorStop(0,`${n.c}${op})`); g.addColorStop(.5,`${n.c}${op*.4})`); g.addColorStop(1,`${n.c}0)`)
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,n.r,0,Math.PI*2); ctx.fill()
      })

      // 2. Spawn pulses on interval (every 2.2–3.5s)
      const pulseInterval=2200+Math.sin(ts*.0003)*650
      if(ts-lastPulse.current>pulseInterval){
        spawnPulse(ts); lastPulse.current=ts
        // Occasionally spawn a second pulse close behind
        if(Math.random()>.65){
          setTimeout(()=>spawnPulse(ts),Math.random()*600+300)
        }
      }


      // 2b. Meteors — spawn every 4-8 seconds
      const meteorInterval = 4200 + Math.random() * 3800
      if (ts - lastMeteor.current > meteorInterval) {
        spawnMeteor()
        if (Math.random() > 0.55) setTimeout(spawnMeteor, 250 + Math.random() * 400)
        lastMeteor.current = ts
      }
      meteorRef.current = meteorRef.current.filter(m => m.frame < m.maxLife)
      meteorRef.current.forEach(m => {
        m.frame++
        m.x += m.vx; m.y += m.vy
        const progress = m.frame / m.maxLife
        const alpha    = m.life * (1 - progress)
        if (alpha < 0.01) return

        const tailX = m.x - m.vx * (m.length / Math.sqrt(m.vx*m.vx+m.vy*m.vy))
        const tailY = m.y - m.vy * (m.length / Math.sqrt(m.vx*m.vx+m.vy*m.vy))

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
        grad.addColorStop(0, `${m.color}0)`)
        grad.addColorStop(0.6, `${m.color}${(alpha * 0.4).toFixed(3)})`)
        grad.addColorStop(1, `${m.color}${(alpha * 0.9).toFixed(3)})`)

        ctx.save()
        ctx.strokeStyle = grad
        ctx.lineWidth   = 1.5
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(m.x, m.y)
        ctx.stroke()

        // Bright head
        ctx.globalAlpha = alpha * 0.9
        ctx.fillStyle   = `${m.color}1)`
        ctx.beginPath()
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 3. Update & draw pulses
      const speed=canvas.width*.00025*16   // expand ~25% of width per second
      pulseRef.current=pulseRef.current.filter(p=>{
        p.radius+=speed
        p.life=Math.max(0,1-(p.radius/p.maxR))
        return p.life>0.005
      })
      pulseRef.current.forEach(p=>drawPulse(p))

      // 4. Connections — use squared distance to avoid sqrt for non-connecting pairs
      const ps=partsRef.current
      const CONN_DIST=115, CONN_DIST2=115*115
      for(let i=0;i<ps.length;i++){
        if(ps[i].type!=='dot') continue
        for(let j=i+1;j<ps.length;j++){
          if(ps[j].type!=='dot') continue
          const dx=ps[i].x-ps[j].x; const dy=ps[i].y-ps[j].y
          const d2=dx*dx+dy*dy
          if(d2<CONN_DIST2){
            const d=Math.sqrt(d2)
            const boost=Math.max(ps[i].boost,ps[j].boost)
            const a=(1-d/CONN_DIST)*0.065*((ps[i].opacity+ps[j].opacity)/2)*8
            ctx.beginPath(); ctx.moveTo(ps[i].x,ps[i].y); ctx.lineTo(ps[j].x,ps[j].y)
            ctx.strokeStyle=`rgba(155,48,255,${a+boost*.08})`
            ctx.lineWidth=0.5+boost*.6; ctx.stroke()
          }
        }
      }

      // 5. Particles
      ps.forEach(p=>{
        // Mouse repulsion — squared check first to avoid sqrt for distant particles
        const mx=p.x-mouse.x; const my=p.y-mouse.y
        const md2=mx*mx+my*my
        if(md2<170*170&&md2>0){const md=Math.sqrt(md2);const f=(170-md)/170; p.vx+=(mx/md)*f*.5; p.vy+=(my/md)*f*.5}

        // Pulse ring interaction
        p.boost=Math.max(0,p.boost-.012)
        pulseRef.current.forEach(pulse=>{
          const dx=p.x-pulse.x; const dy=p.y-pulse.y
          const dist=Math.sqrt(dx*dx+dy*dy)
          const edge=Math.abs(dist-pulse.radius)
          if(edge<55&&pulse.life>.05){
            const f=(1-edge/55)*pulse.life
            const nx=dx/(dist||1); const ny=dy/(dist||1)
            p.vx+=nx*f*1.6; p.vy+=ny*f*1.6     // push radially outward
            p.boost=Math.max(p.boost,f*pulse.life)
          }
        })

        // Spring back
        p.vx+=(p.baseVx-p.vx)*.04; p.vy+=(p.baseVy-p.vy)*.04
        p.x+=p.vx; p.y+=p.vy

        // Wrap
        if(p.x<-20) p.x=canvas.width+20; if(p.x>canvas.width+20) p.x=-20
        if(p.y<-20) p.y=canvas.height+20; if(p.y>canvas.height+20) p.y=-20

        p.phase+=p.speed
        p.opacity=p.maxOp*(0.35+0.65*(0.5+0.5*Math.sin(p.phase)))
        const dispOp=Math.min(1,p.opacity+p.boost*p.maxOp*2.2)

        ctx.save(); ctx.globalAlpha=dispOp

        if(p.type==='dot'){
          const r=p.size*(4+p.boost*5)
          const gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r)
          gr.addColorStop(0,`${p.color}1)`); gr.addColorStop(.35,`${p.color}0.6)`); gr.addColorStop(1,`${p.color}0)`)
          ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill()
          ctx.fillStyle=`${p.color}1)`; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*.6,0,Math.PI*2); ctx.fill()
          if(p.boost>.25){
            ctx.globalAlpha=dispOp*p.boost*.5
            ctx.strokeStyle=`${p.color}.9)`; ctx.lineWidth=.8
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(7+p.boost*5),0,Math.PI*2); ctx.stroke()
          }
        } else if(p.type==='ring'){
          ctx.strokeStyle=`${p.color}0.9)`; ctx.lineWidth=.8+p.boost*1.5
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.stroke()
          ctx.strokeStyle=`${p.color}${.25+p.boost*.3})`; ctx.lineWidth=2+p.boost*3
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size+3,0,Math.PI*2); ctx.stroke()
        } else if(p.type==='paw'){
          const s=p.size*(1+p.boost*.6)
          ctx.fillStyle=`${p.color}${.8+p.boost*.2})`
          ctx.beginPath(); ctx.arc(p.x,p.y,s*.5,0,Math.PI*2); ctx.fill()
          const toes:[[number,number],[number,number],[number,number]]=[[-s*.7,-s*.7],[0,-s],[s*.7,-s*.7]]
          toes.forEach(([tx,ty])=>{ctx.beginPath(); ctx.arc(p.x+tx,p.y+ty,s*.3,0,Math.PI*2); ctx.fill()})
        } else {
          ctx.strokeStyle=`${p.color}.7)`; ctx.lineWidth=.8
          ctx.beginPath()
          ctx.moveTo(p.x-p.size,p.y); ctx.lineTo(p.x+p.size,p.y)
          ctx.moveTo(p.x,p.y-p.size); ctx.lineTo(p.x,p.y+p.size)
          ctx.stroke()
        }
        ctx.restore()
      })

      frameRef.current=requestAnimationFrame(draw)
    }
    frameRef.current=requestAnimationFrame(draw)

    return()=>{
      window.removeEventListener('resize',resize)
      window.removeEventListener('mousemove',onMouse)
      cancelAnimationFrame(frameRef.current)
    }
  },[])

  return(
    <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>
  )
}
