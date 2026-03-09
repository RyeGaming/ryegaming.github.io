function draw_grass() {
    let col_lerp_factor = document.getElementById("offsetSlider")
    col_lerp_factor = col_lerp_factor.value/col_lerp_factor.max
    
    let mult = lerpColor( color(11, 24, 107), color(249,168,53),col_lerp_factor)
    let primary = $('#grassColorPicker').val();
    fill(red(primary)*red(mult)/255, green(primary)*green(mult)/255, blue(primary)*blue(mult)/255)
    beginShape();
    vertex(0, height)
    for(let i = 0; i<=width; i+=5){
      let x = i
      let y = arc_calc(i, width/2, height*0.1, 4000)
      //ellipse(i, height*0.9-y, 10, 10)
      if(i%10>0){
        y -= height*0.06
      }else{
        if(i<width/2){
          x += Math.abs(cos(millis()*0.001*noise(x))*2)*-1+noise(x)*-3
        }else{
          x -= Math.abs(cos(millis()*0.001*noise(x))*2)*-1+noise(x)*-3
        }
      }
      vertex(x, height*0.9-y+noise(i)*20)
  
    }
    vertex(width, height)
    endShape(CLOSE);
  
    
  }
  
  function arc_calc(x, centerX, centerY, stretch_factor){
    return (-1/stretch_factor)*Math.pow(x-centerX, 2)+centerY
  }