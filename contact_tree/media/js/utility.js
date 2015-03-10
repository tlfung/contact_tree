var util = {
	sampleTree: function(s, canvas_id){
		var mapping = document.getElementById(canvas_id);
		var context =  mapping.getContext('2d');

		var orix = 500;
		var oriy = 580;

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, mapping.width, mapping.height);
		context.save();

		context.translate(0.5, 0,5);
		context.scale(0.45,0.45);

		context.lineWidth = 3;
		context.fillStyle ='#7D6041';
		context.strokeStyle = '#7D6041';

		context.beginPath();

		context.moveTo(orix+90,oriy+350);
		context.lineTo(orix+80,oriy);
		context.lineTo(orix,oriy);
		context.lineTo(orix,oriy+350);
		context.closePath();


		context.moveTo(orix+50,oriy);
		context.bezierCurveTo(orix+50,oriy-300, orix+30,oriy-450,  orix+150,oriy-550);
		context.bezierCurveTo(orix,oriy-480, orix,oriy-300,  orix-50,oriy);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		// context.fillStyle ='#7D6041';
		// context.strokeStyle = '#7D6041';

		// branch
		context.beginPath();

		context.moveTo(orix+80,oriy);
		context.bezierCurveTo(orix+80,oriy, orix+70,oriy-300,  orix+250,oriy-330);
		context.lineTo(orix+250,oriy-360);
		context.bezierCurveTo(orix+210,oriy-350, orix,oriy-300,  orix,oriy);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		// context.lineWidth = 5;
		context.moveTo(orix+250,oriy-357);
		context.lineTo(orix+330,oriy-450);
		context.lineTo(orix+248,oriy-332);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		context.moveTo(orix+248,oriy-332);
		context.lineTo(orix+330,oriy-250);
		context.lineTo(orix+250,oriy-357);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		// fade out
		var grd = context.createLinearGradient(orix+250, oriy-330, orix+450,oriy-400);
        grd.addColorStop(0, '#7D6041');
        grd.addColorStop(1, '#000000');

        // this.context.fillStyle = grd;
		context.fillStyle =grd;
		context.strokeStyle = grd;
		context.beginPath();
		context.moveTo(orix+250, oriy-330);
		context.bezierCurveTo(orix+300, oriy-360, orix+400, oriy-330,  orix+450,oriy-400);
		context.bezierCurveTo(orix+400, oriy-340, orix+300, oriy-370,  orix+250,oriy-360);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color



		context.fillStyle ='rgb(0,150,0)';
		context.strokeStyle = 'rgb(0,150,0)';
		context.beginPath();
		context.moveTo(orix+330,oriy-450);
		context.bezierCurveTo(orix+330,oriy-450, orix+290,oriy-550,  orix+200,oriy-500);
		context.bezierCurveTo(orix+200,oriy-500, orix+250,oriy-400,  orix+330,oriy-450);
		//context.lineTo(orix+230,oriy-500);
		//context.moveTo(orix+330,oriy-450);
		context.bezierCurveTo(orix+330,oriy-450, orix+370,oriy-530,  orix+450,oriy-480);
		context.bezierCurveTo(orix+450,oriy-480, orix+390,oriy-400,  orix+330,oriy-450);
		//context.lineTo(orix+450,oriy-480);
		context.closePath();

		context.moveTo(orix+330,oriy-250);
		context.bezierCurveTo(orix+330,oriy-250, orix+250,oriy-280,  orix+230,oriy-200);
		context.bezierCurveTo(orix+230,oriy-200, orix+290,oriy-150,  orix+330,oriy-250);
		//context.lineTo(orix+230,oriy-200);
		//context.moveTo(orix+330,oriy-250);
		context.bezierCurveTo(orix+330,oriy-250, orix+360,oriy-330,  orix+450,oriy-280);
		context.bezierCurveTo(orix+450,oriy-280, orix+390,oriy-190,  orix+330,oriy-250);
		//context.lineTo(orix+450,oriy-280);
		context.closePath();
		context.stroke();//draw line
		context.fill();//fill color


		// right
		context.fillStyle ='#7D6041';
		context.strokeStyle = '#7D6041';
		context.beginPath();
		context.moveTo(orix-90,oriy+350);
		context.lineTo(orix-80,oriy);
		context.lineTo(orix,oriy);
		context.lineTo(orix,oriy+350);
		context.closePath();

		context.moveTo(orix-50,oriy);
		context.bezierCurveTo(orix-50,oriy-300, orix-30,oriy-450,  orix-150,oriy-550);
		context.bezierCurveTo(orix,oriy-480, orix,oriy-300,  orix+50,oriy);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		// branch
		context.moveTo(orix-80,oriy);
		context.bezierCurveTo(orix-80,oriy, orix-70,oriy-300,  orix-250,oriy-330);
		context.lineTo(orix-250,oriy-360);
		context.bezierCurveTo(orix-210,oriy-350, orix,oriy-300,  orix,oriy);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		context.moveTo(orix-250,oriy-357);
		context.lineTo(orix-330,oriy-450);
		context.lineTo(orix-248,oriy-332);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		context.moveTo(orix-248,oriy-332);
		context.lineTo(orix-330,oriy-250);
		context.lineTo(orix-250,oriy-357);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		// fade out
		var grd = context.createLinearGradient(orix-250, oriy-330, orix-450,oriy-400);
        grd.addColorStop(0, '#7D6041');
        grd.addColorStop(1, '#000000');

        // this.context.fillStyle = grd;
		context.fillStyle = grd;
		context.strokeStyle = grd;
		context.beginPath();
		context.moveTo(orix-250, oriy-330);
		context.bezierCurveTo(orix-300, oriy-360, orix-400, oriy-330,  orix-450,oriy-400);
		context.bezierCurveTo(orix-400, oriy-340, orix-300, oriy-370,  orix-250,oriy-360);
		//context.lineTo(orix,oriy+250);
		context.closePath();

		context.stroke();//draw line
		context.fill();//fill color

		// fruit
		context.beginPath();
		context.fillStyle ='rgb(180,0,0)';//fill color
		context.strokeStyle ='rgb(180,0,0)';//line's color
		context.arc(orix-330, oriy-485, 30, 0, 2*Math.PI, true);
		context.stroke();//draw line
		context.fill();//fill color

		context.fillStyle ='rgb(0,150,0)';
		context.strokeStyle = 'rgb(0,150,0)';
		context.beginPath();
		context.moveTo(orix-330,oriy-450);
		context.bezierCurveTo(orix-330,oriy-450, orix-290,oriy-550,  orix-200,oriy-500);
		context.bezierCurveTo(orix-200,oriy-500, orix-250,oriy-400,  orix-330,oriy-450);
		//context.lineTo(orix+230,oriy-500);
		//context.moveTo(orix+330,oriy-450);
		context.bezierCurveTo(orix-330,oriy-450, orix-370,oriy-530,  orix-450,oriy-480);
		context.bezierCurveTo(orix-450,oriy-480, orix-390,oriy-400,  orix-330,oriy-450);
		//context.lineTo(orix+450,oriy-480);
		context.closePath();

		context.moveTo(orix-330,oriy-250);
		context.bezierCurveTo(orix-330,oriy-250, orix-250,oriy-280,  orix-230,oriy-200);
		context.bezierCurveTo(orix-230,oriy-200, orix-290,oriy-150,  orix-330,oriy-250);
		//context.lineTo(orix+230,oriy-200);
		//context.moveTo(orix+330,oriy-250);
		context.bezierCurveTo(orix-330,oriy-250, orix-360,oriy-330,  orix-450,oriy-280);
		context.bezierCurveTo(orix-450,oriy-280, orix-390,oriy-190,  orix-330,oriy-250);
		//context.lineTo(orix+450,oriy-280);
		context.closePath();
		context.stroke();//draw line
		context.fill();//fill color

		if(s=='side'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Trunk Side', orix+40,oriy+150);

			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			//context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);
			context.fillText('Brightness',  orix+130,oriy-450);
			context.fillText('Fruit',  orix-430, oriy-500);
		}

		else if(s=='branch'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Branch Layer', orix-120,oriy-250);
			context.font = '24pt Calibri';

			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			//context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);
			context.fillText('Brightness',  orix+130,oriy-450);
			context.fillText('Fruit',  orix-430, oriy-500);
		}

		else if(s=='bside'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Branch Side', orix-280,oriy-380);

			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			//context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);
			context.fillText('Brightness',  orix+130,oriy-450);
			context.fillText('Fruit',  orix-430, oriy-500);
		}

		else if(s=='lsize'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Size', orix+400,oriy-300);

			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			//context.fillText('Size', orix+400,oriy-300);
			context.fillText('Brightness',  orix+130,oriy-450);
			context.fillText('Fruit',  orix-430, oriy-500);
		}

		else if(s=='lbright'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Brightness',   orix+130,oriy-450);

			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);
			context.fillText('Fruit',  orix-430, oriy-500);
			//context.fillText('Brightness',  orix+130,oriy-450);
		}

		else if(s=='fruit'){
			context.font = '36pt Calibri';
			context.fillStyle = 'red';
			context.fillText('Fruit',  orix-470, oriy-500);

			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);

			context.fillText('Brightness',  orix+130,oriy-450);
		}

		else{
			context.font = '24pt Calibri';
			context.fillStyle = 'black';
			context.fillText('Trunk Side', orix+40,oriy+150);
			context.fillText('Branch Layer', orix-80,oriy-250);
			context.fillText('Branch Side', orix-280,oriy-380);
			context.fillText('Size', orix+400,oriy-300);
			context.fillText('Brightness',  orix+130,oriy-450);
			context.fillText('Fruit',  orix-430, oriy-500);
		}
		context.restore();

	},
    
    order_list: function(s, e){
		var gen_order = [];
		for(var c = 0; c < e; c++){
			gen_order.push(c);
		}
		return gen_order;
    },

    unique: function(itm, i, a){
		return i==a.indexOf(itm);
	}

};

jQuery.fn.center = function () {
        this.css("position","absolute");
        this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2)) + "px");
        this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2)) + "px");
        return this;
    };