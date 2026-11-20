// Each inscription identifies a tenant, a public service, or an industrial
// process. The right-hand secondary line remains legible from the sidewalk.
const stock=[
  ['record','逆相唱片','黑胶修复 · 夜场试听','culture','wave'],
  ['clinic','流明诊所','义体复诊 / 夜间应诊','civic','cross'],
  ['northCom','北线通信','终端续费 · 公用接入','circuit','signal'],
  ['noodles','巷口汤面','夜锅常开 · 窗口取餐','counter','bowl'],
  ['forge','河湾机造','轴承复检 / 夜班收件','industry','gear'],
  ['dispatch','夜港调度','装卸二班 · 凭单入场','industry','crane'],
  ['pier','潮汐码头','西岸栈桥 / 夜航泊位','civic','ferry'],
  ['provisions','船用补给','防水接头 · 船具零配','industry','crate'],
  ['dockMarket','鱼汛夜市','当班鲜货 · 称重交收','counter','fish'],
  ['garden','东园湿地','夜行步道 · 公共开放','garden','leaf'],
  ['pump','水位遥测','生态泵站 / 水位联测','garden','gauge'],
  ['nursery','恒温苗圃','水培育苗 · 夜间养护','garden','seed'],
  ['cafe','深焙咖啡','现磨手冲 / 街边自取','counter','cup'],
  ['greenline','绿廊步道','上层步行线 · 城区连通','garden','rail'],
  ['overlook','河岸眺台','临水缓行 · 夜航观察','garden','ferry'],
  ['tailor','绫记裁缝','义肢袖口 · 量身改衣','culture','spool'],
  ['grocery','水培果蔬','今日到架 / 社区菜铺','garden','seed'],
  ['press','留影印务','小批快印 · 夜班装订','culture','press'],
  ['books','字里旧书','档案修复 / 交换书架','culture','book'],
  ['studio','余响声场','模拟合成 · 排练预约','culture','wave'],
  ['textile','纬线织社','导电织物 / 小样打版','culture','spool'],
  ['wash','泡沫洗衣','自助烘干 · 夜间取衣','civic','drum'],
  ['lofts','街坊驿站','住户寄取 / 夜间留件','civic','crate'],
  ['streetMarket','春街夜集','热食 · 修补 · 街坊交易','counter','awning'],
  ['junction','轨道交换所','住户服务 / 夜间值班','circuit','signal'],
  ['archive','区政档案','夜间检索 / 自助投递','civic','book'],
  ['data','脉冲中继','主干光缆 · 信道待命','circuit','relay'],
  ['parts','拆机公社','电驱总成 · 旧件周转','industry','gear'],
  ['winding','磁环绕组','线圈重绕 / 工单登记','industry','spool'],
  ['sleep','长夜公寓','夜间门房 · 住户服务','civic','window'],
  ['charge','白昼电业','储电模块 / 轮班检修','circuit','relay'],
  ['lobby','衡光联合','企业访客 / 前台登记','circuit','tower'],
  ['transit','末班接驳','东环线 / 夜间站务','civic','rail'],
  ['partsBay','收发货口','卸货登记 · 04 号仓','industry','crate'],
  ['fabrication','折光智造','光刻检验 / 净化车间','circuit','chip'],
  ['streetMed','夜值药柜','常用敷料 · 刷证领取','civic','cross']
];
const chroma={
  industry:['#283841','#f2b45f','#ffe6ac'],garden:['#1d4041','#8ecbb2','#e8edcd'],
  counter:['#723842','#ffb778','#fff0cc'],culture:['#342e47','#c5a4cb','#f8deca'],
  circuit:['#182c40','#81cce1','#d8faff'],civic:['#243e46','#b6d1cc','#edf3db']
};

// Horizontal runs become led tubes on selected physical crowns and cut
// vinyl or inset lamps on their corresponding printed fascia.
export const stencils={
  wave:['..#......#..','..#.##...#..','#.#.##.#.#.#','############','#.#.##.#.#.#','..#.##...#..','..#......#..'],
  cross:['....###....','....###....','###########','###########','....###....','....###....'],
  signal:['......##....','....##..##..','..##..##..##','....##..##..','......##....','......##....','....######..'],
  bowl:['...#..#..#..','..#..#..#...','............','############','.##########.','..########..','....####....','...######...'],
  gear:['..##..##..','.########.','###....###','##..##..##','###....###','.########.','..##..##..'],
  crane:['..##########','..##....##.#','..##....##.#','..#####....#','..##.......#','..##......##','######......'],
  ferry:['....###.....','..#######...','..#.#.#.#...','############','.##########.','............','###..###..##'],
  crate:['.##########.','##....##..##','##....##..##','##....##..##','##........##','##........##','.##########.'],
  fish:['...######..#','.##...#.####','##.....#####','.##....####.','...#####...#'],
  leaf:['....########','..###.....##','.##...##..##','##...##..##.','##..##..##..','.#######....','..##........'],
  gauge:['....###....#','..##...##.##','.#..##..#.#.','.#...###..##','..##...##.#.','....###...##'],
  seed:['.####...###.','..####.###..','....####....','.....##.....','.....##.....','..########..'],
  cup:['.######.....','.##########.','.##..##..##.','.##..#####..','..####......','#########...'],
  rail:['..########..','.##......##.','.##......##.','.##########.','..##....##..','.##......##.','############'],
  spool:['.##########.','...######...','...##.###...','...###.##...','...##.###...','.##########.'],
  press:['..########..','..##....##..','############','##..####..##','############','...######...'],
  book:['#####..#####','#....##....#','#....##....#','#....##....#','#####..#####','.....##.....'],
  drum:['.##########.','.##.##.#.##.','.##########.','.##..##..##.','.##.#..#.##.','.##..##..##.','.##########.'],
  awning:['..########..','.##.##.##.#.','############','.#........#.','.#........#.','############'],
  relay:['..##....##..','..########..','###......###','###..##..###','###......###','..########..','..##....##..'],
  window:['.##########.','.#..##..#.#.','.##########.','.#..##..#.#.','.##########.'],
  tower:['.....##.....','....####....','..######....','..##.###....','..##.#####..','..##.##.##..','############'],
  chip:['...#.#.#....','.#########..','##.......###','.##.###.##..','##.......###','.#########..','...#.#.#....']
};
export function paintDistrictAtlas(g,tiles){
  const put=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  const text=(s,x,y,size,ink,maxWidth,book=false)=>{
    g.font=(book?'bold ':'700 ')+size+'px '+(book?'"Songti SC","STZhongsong",SimSun,':'')+'"Microsoft YaHei","PingFang SC",sans-serif';
    g.textAlign='left';g.textBaseline='middle';g.fillStyle=ink;g.fillText(s,x,y,maxWidth);
  };
  stock.forEach(([id,title,sub,group,icon],i)=>{
    const x=7+(i%3)*340,y=1030+Math.floor(i/3)*84,w=328,h=74;
    const [back,accent,ink]=chroma[group];
    g.save();put(x-3,y-3,w+6,h+6,back);g.beginPath();g.rect(x,y,w,h);g.clip();g.translate(x,y);
    if(group==='industry'){
      put(0,0,58,h,accent);
      for(let j=0;j<8;j++){put(66+j*10,66,5,8,accent);}
      put(65,4,250,2,accent);
    }else if(group==='counter'){
      put(0,3,w,3,accent);put(0,h-6,w,2,accent);put(7,12,48,49,accent);put(10,15,42,43,back);
    }else if(group==='culture'){
      put(4,0,53,h,accent);put(7,7,47,h-14,back);put(65,53,240,1,accent);
    }else if(group==='garden'){
      put(0,0,58,h,accent);put(58,0,7,h,back);put(62,3,3,h-6,accent);
    }else if(group==='circuit'){
      put(0,0,58,h,'#273f55');put(0,0,22,4,accent);put(0,4,4,17,accent);put(w-35,h-4,35,4,accent);put(w-4,h-19,4,15,accent);
    }else{
      put(0,0,4,h,accent);put(7,11,47,45,accent);put(58,5,1,64,accent);
    }
    const inset=group==='industry'||group==='garden'||group==='civic';
    const rows=stencils[icon],pitch=3.1;
    const left=29-rows[0].length*pitch/2,top=34-rows.length*pitch/2;
    rows.forEach((row,r)=>{for(const run of row.matchAll(/#+/g))put(left+run.index*pitch,top+r*pitch,run[0].length*pitch,pitch+.09,inset?back:accent);});
    text(title,71,26,38,ink,242,group==='counter'||group==='culture');
    text(sub,group==='industry'?152:72,61,13,accent,group==='industry'?168:242);
    if(group==='circuit')for(let j=0;j<5;j++)put(314-j*6,5,3,3+j,accent);
    g.restore();
    tiles[id]={title,glow:parseInt(accent.slice(1),16),aspect:w/h,u0:(x+.5)/1024,u1:(x+w-.5)/1024,v0:1-(y+h-.5)/2048,v1:1-(y+.5)/2048,group,icon};
  });
}
