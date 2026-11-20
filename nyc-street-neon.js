const pink=0xff83c1,ice=0x87f9ff,warm=0xffd594,steel=0x343743;

// Coloured tube cells sit in open air. Adjacent cells share one glass run,
// including its front, back and sides; the dark supports sit behind the glass.
const crowns={
  optics:[
    '        ppppppp        ',
    '     ppp       ppp     ',
    '   pp             pp   ',
    '  p      iiiii      p  ',
    ' p      i     i      p ',
    'p      i   ii  i      p',
    ' p     i   ii  i     p ',
    '  p     i     i     p  ',
    '   pp    iiiii    pp   ',
    '     ppp       ppp     ',
    '        ppppppp        '
  ],
  photo:[
    '       pppppp      iii ',
    '      p      p     i i ',
    ' ppppp        ppppppii ',
    'p                     p',
    'p  iii    pppp        p',
    'p        p    p       p',
    'p       p      p      p',
    'p       p      p      p',
    'p        p    p       p',
    'p         pppp        p',
    ' ppppppppppppppppppppp '
  ],
  keys:[
    '   wwwww          ',
    ' ww     ww        ',
    'w   ii    w       ',
    'w   ii    wwwwwwww',
    'w         w  w w w',
    ' ww     ww   w www',
    '   wwwww          '
  ]
};

export function addNeonCrown(site,box,emit){
  if(site.kind!=='blade')return;
  const key=site.id,legacy=site.z> -150,rows=crowns[key];
  if(!rows||(key==='keys'?!legacy:legacy))return;
  const pitch=key==='keys'?.06:.08,width=rows[0].length*pitch;
  const height=rows.length*pitch,base=site.height/2+.17,centre=-.15*(site.mountSide||1);
  for(const side of [-1,1]){
    const u=centre+side*width*.21;
    box(steel,u,base+.015,-.14,.095,.34,.20);
    box(0x676576,u,base-.09,-.14,.17,.06,.25);
  }
  for(let r=0;r<rows.length;r++){
    for(const run of rows[r].matchAll(/p+|i+|w+/g)){
      const k=run[0][0],length=run[0].length;
      const u=centre+(run.index+length/2)*pitch-width/2;
      const y=base+height-(r+.5)*pitch,depth=k==='i'?.25:.16;
      emit(k==='i'?ice:k==='p'?pink:warm,u,y,-.14,length*pitch,pitch,depth);
    }
  }
}
