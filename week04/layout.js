function getStyle(element) {
  // 没有computed 没有css 跳出
  if (!element.style) {
    element.style = {};
  }
  // 过滤 非felx块 和文本节点
  for (let prop in element.computedStyle) {
    element.style[prop] = element.computedStyle[prop].value;

    if (element.style[prop].toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
    if (element.style[prop].toString().match(/^[0-9\.]$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
  }
  return element.style;
}

function layout(element) {
  // 没有computed 没有css 跳出
  if (!element.computedStyle) {
    return (void 0);
  }

  let elementStyle = getStyle(element);

  // 过滤 非felx块 和文本节点
  if (elementStyle.display !== "flex") {
    return (void 0);
  }

  let items = element.children.filter(item => item.type === "element");

  items.sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });

  ['width', 'height'].forEach(size => {
    if (elementStyle[size] === "auto" || elementStyle[size] === '') {
      elementStyle[size] = null;
    }
  });

  if (!elementStyle.flexDirection || elementStyle.flexDirection === "auto") {
    elementStyle.flexDirection = "row";
  }
  if (!elementStyle.alignItems || elementStyle.alignItems === "auto") {
    elementStyle.alignItems = "stretch";
  }
  if (!elementStyle.justifyContent || elementStyle.justifyContent === "auto") {
    elementStyle.justifyContent = "flex-start";
  }
  if (!elementStyle.flexWrap || elementStyle.flexWrap === "auto") {
    elementStyle.flexWrap = "nowrap";
  }
  if (!elementStyle.alignContent || elementStyle.alignContent === "auto") {
    elementStyle.alignContent = "stretch";
  }


  var mainSize, mainStart, mainEnd, mainSign, mainBase, crossSize, crossStart,
    crossEnd, crossSign, crossBase

  if (elementStyle.flexDirection === "row") {
    mainSize = "width";
    mainStart = "left";
    mainEnd = "right";
    mainSign = +1;
    mainBase = 0;

    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  } else if (elementStyle.flexDirection === "row-reverse") { // from right to left
    mainSize = "width";
    mainStart = "left";
    mainEnd = "right";
    mainSign = -1;
    mainBase = elementStyle.width;

    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  } else if (elementStyle.flexDirection === "column") { // from top to down
    mainSize = "height";
    mainStart = "top";
    mainEnd = "bottom";
    mainSign = +1;
    mainBase = 0;

    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  } else if (elementStyle.flexDirection === "column-reverse") { // from bottom to top
    mainSize = "height";
    mainStart = "bottom";
    mainEnd = "top";
    mainSign = -1;
    mainBase = elementStyle.height;

    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  }

  if (elementStyle.flexWrap === "wrap-reverse") {

    let tmp = crossStart;
    crossStart = crossEnd;
    crossEnd = tmp;
    crossSign = -1;
  } else {
    crossBase = 0;
    crossSign = +1;
  }

  let isAutoMainSize = false;
  if (!elementStyle[mainSize]) {
    elementStyle[mainSize] = 0;
    for (let item of element.children) {
      let itemStyle = getStyle(item);
      if (itemStyle[mainSize] !== null || itemStyle[mainSize] > 0) {
        elementStyle[mainSize] += itemStyle[mainSize];
      }
    }
    isAutoMainSize = true;
  }

  let flexLine = []
  let flexLines = [flexLine];

  let mainSpace = elementStyle[mainSize]; // 主轴剩余空间
  let crossSpace = 0; // 交叉轴剩余空间

  for (let item of items) {
    let itemStyle = getStyle(item);

    if (itemStyle[mainSize] === null) {
      itemStyle[mainSize] = 0;
    }

    if (itemStyle.flex) {
      flexLine.push(item);
    } else if (itemStyle.flexWrap === 'nowrap' && isAutoMainSize) {
      mainSpace -= itemStyle[mainSize];
      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
        // 计算行高 一行有多高取决于一行内元素行高最大
        crossSpace = Math.max(crossSpace, itemStyle[crossSpace]);
      }
      flexLine.push(item);
    } else {
      // 换行逻辑
      // 比主轴大的 默认设置于主轴等大 独占一行
      if (itemStyle[mainSize] > elementStyle[mainSize]) { // 比父元素的size还要大
        itemStyle[mainSize] = elementStyle[mainSize];
      }

      if (mainSpace < itemStyle[mainSize]) {
        // 主轴内剩余空间不足以容纳元素 换行
        //主轴剩余空间 作为属性保存在行上
        flexLine.mainSpace = mainSpace;
        flexLine.crossSpace = crossSpace;
        flexLine.push(item);
        flexLines.push(flexLine);

        // 创建新行
        // 重置尺寸
        flexLine =[]
        mainSpace = elementStyle[mainSize];
        crossSpace = 0;
      } else {
        flexLine.push(item);
      }

      // 放置元素后的计算
      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
        crossSpace = Math.max(crossSpace, itemStyle[crossSpace]);
      }


      mainSpace -= itemStyle[mainSize];
    }
  }
  // 计算结束 元素清空
  flexLine.mainSpace = mainSpace;
  if (elementStyle.flexWrap === 'nowrap' || isAutoMainSize) {
    flexLine.crossSpace = (elementStyle[crossSize] !== (void 0)) ? elementStyle[crossSize] : crossSpace;
  } else {
    flexLine.crossSpace = crossSpace;
  }
  console.log(flexLines);


  if (mainSpace < 0){

    let scale = elementStyle[mainSize] / (elementStyle[mainSize] - mainSpace);
    let currentMain = 0;
    for(let item of items){
      let itemStyle = getStyle(item);

      if(itemStyle.flex){
        itemStyle[mainSize] = 0;
      }

      itemStyle[mainSize] = itemStyle[mainSize] * scale;
      itemStyle[mainStart] = currentMain;

      itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
      currentMain = itemStyle[mainEnd];
    }
  } else {
    // process each flexLine
    flexLines.forEach(function(items){
      let lineMainSpace = items.mainSpace;
      let flexTotal = 0;
      for(let item of items){
        let itemStyle = getStyle(item);
        if((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))){
          flexTotal += itemStyle.flex;
        }
      }

      if(flexTotal>0){

        let currentMain = mainBase;
        for(let item of items){
          let itemStyle = getStyle(item);
          if(itemStyle.flex){
            itemStyle[mainSize] = (lineMainSpace / flexTotal) * itemStyle.flex;
          }
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd];
        }
      } else {
        var currentMain;
        var step ;
        if(style.justifyContent === "flex-start"){
          step = 0;
          currentMain = mainBase
        }
        if(style.justifyContent === "flex-end"){
          step = 0;
          currentMain = mainBase + lineMainSpace * mainSign
        }
        if(style.justifyContent === "center"){
          step = 0;
          currentMain = mainBase + lineMainSpace / 2 * mainSign
        }
        if(style.justifyContent === "space-between"){
          step = lineMainSpace / (items.length - 1) * mainSign
          currentMain = mainBase + step;
        }
        if(style.justifyContent === "space-around"){
          step = mainSpace / items.length * mainSign
          currentMain = mainBase + step / 2 ;
        }
        for(let item of items){
          itemStyle = getStyle(item);
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd] + step;
        }
      }
    });
  }

  if(!elementStyle[crossSize]){
    crossSpace = 0;
    elementStyle[crossSize] = 0;

    for(let flexLine of flexLines){
      elementStyle[crossSize] = elementStyle[crossSize] + flexLine.crossSpace;
    }
  } else {
    crossSpace = elementStyle[crossSize];
    for(let flexLine of flexLines){
      crossSpace -= flexLine.crossSpace;
    }
  }

  if(elementStyle.flexWrap === "wrap-reverse"){
    crossBase = elementStyle[crossSize];
  } else {
    crossBase = 0;
  }
  let lineCrossSize = elementStyle[crossSize] / flexLines.length;
  let step;
  if(elementStyle.alignContent === "flex-start"){
    crossBase += 0;
    step = 0;
  }
  if(elementStyle.alignContent === "flex-end"){
    crossBase += crossSign * crossSpace;
    step = 0;
  }
  if(elementStyle.alignContent === "center"){
    crossBase += crossSign * crossSpace / 2;
    step = 0;
  }
  if(elementStyle.alignContent === "space-between"){
    crossBase = 0;
    step = crossSpace / (flexLines.length -1);
  }
  if(elementStyle.alignContent === "space-around"){
    step = crossSpace / flexLines.length;
    crossBase += crossSign * step / 2;
  }
  if(elementStyle.alignContent === "stretch"){
    crossBase += 0;//?
    step = 0;
  }
  flexLines.forEach(function(items){
    let lineCrossSize = elementStyle.alignContent === "stretch" ?
      items.crossSpace + crossSpace / flexLines.length :
      items.crossSpace;
    for(let item of items){
      let itemStyle = getStyle(item);

      let align = itemStyle.alignSelf || elementStyle.alignItems; //受alignSelf影响，也受父元素的alignItems的影响

      if(itemStyle[crossSize] === null || itemStyle[crossSize] === (void 0)){ // if height is not defined
        itemStyle[crossSize] = (align === "stretch") ? lineCrossSize : 0; //?
      }

      if(align === "flex-start"){
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSpace;
      }
      if(align === "flex-end"){
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
        itemStyle[crossStart] = itemStyle[crossStart] - crossSpace;
      }
      if(align === "center"){
        itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize])/2;
        itemStyle[crossEnd] = item[crossStart] + crossSign * itemStyle[crossSize];
      }
      if(align === "stretch"){
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] = crossBase + crossSign * itemStyle[crossSize];
        itemStyle[crossSize] = crossSign * itemStyle[crossSize];
      }
    }
    crossBase += crossSign * (lineCrossSize + step);
  });
}

module.exports = layout;
