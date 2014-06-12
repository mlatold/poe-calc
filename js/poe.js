var aura_group = "";

$.fn.restricted_val = function(){
	var obj = $(this);
	var val = parseInt(obj.val());
	var lower = parseInt(obj.attr('min'));
	var upper = parseInt(obj.attr('max'));
	if(isNaN(val)) {
		obj.val("");
		return 0;
	}
	if(obj.val() < lower) {
		obj.val(lower);
		return lower;
	}
	if(obj.val() > upper) {
		obj.val(upper);
		return upper;
	}
	obj.val(val);
	return val;
}

var recalculate = function(nohash) {
	var flat = [0, 0];
	var perc = [0, 0];

	// Blood magic skill
	$(".mcs").removeClass("disabled");
	$(".mcs input").prop("disabled", false);
	if(!$("input[name=bms]:checked").length) {
		$(".mcs").addClass("disabled");
		$(".mcs input").prop("checked", false);
		$(".mcs input").prop("disabled", true);
	}
	// Midnight Bargin 2
	$(".mi2").removeClass("disabled");
	$(".mi2 input").prop("disabled", false);
	if(!$("input[name=mid]:checked").length) {
		$(".mi2").addClass("disabled");
		$(".mi2 input").prop("checked", false);
		$(".mi2 input").prop("disabled", true);
	}

	$(".advanced").hide();
	if($(".adv input:checked").length) {
		$(".advanced").show();
	}
	else {
		$(".alh input").prop("checked", false);
		$(".bma input").prop("checked", false);
		$(".mul input").val("100");
	}

	// Skill tree
	var reduced_mana = ($(".rms input[type=number]").restricted_val() - 100) * -1;
	var mortal_conv = $(".mcs input:checked").length ? .6 : 1;

	// Alpha's howl
	reduced_mana -= $(".alp input:checked").length ? 8 : 0;

	// Midnight Bargin
	perc[1] += $(".mid input:checked").length ? 30 : 0;
	perc[1] += $(".mi2 input:checked").length ? 30 : 0;

	$(".aura-grp").each(function() {
		// blood magic gem
		var bm_gem_multipliers = [2.45, 2.42, 2.39, 2.37, 2.34, 2.32, 2.29, 2.26, 2.24, 2.21, 2.18, 2.16, 2.13, 2.11, 2.08, 2.05, 2.03, 2.00, 1.97, 1.96, 1.93];
		var bm_gem_lvl = $(".bmg input[type=number]", this).restricted_val();
		var bm_gem_multi = bm_gem_lvl == 0 ? 100 : Math.ceil(bm_gem_multipliers[bm_gem_lvl - 1] * 100);
		$(".bmg .multi", this).html("x" + bm_gem_multi.toString() + "%");

		// is blood magic on?
		var blood_magic = ($(".bms input:checked").length || $(".bma input:checked", this).length || bm_gem_lvl) ? true : false;

		var other_multi = $(".mul input[type=number]", this).restricted_val();
		other_multi += $(".enl input:checked", this).length ? 25 : 0;
		other_multi += $(".enh input:checked", this).length ? 25 : 0;
		other_multi += $(".emp input:checked", this).length ? 25 : 0;

		// reduced mana gem
		var rm_gem_lvl = $(".rmg input[type=number]", this).restricted_val();
		var rm_gem_multi = rm_gem_lvl == 0 ? 100 : 91 - rm_gem_lvl;
		$(".rmg .multi", this).html("x" + rm_gem_multi.toString() + "%");

		var additional_reduced_mana = 0;
		if($(".prg input:checked", this).length) {
			additional_reduced_mana = 25;
			blood_magic = true;
		}

		// Alpha's howl for snapshotting
		additional_reduced_mana += $(".alh input:checked").length ? 8 : 0;

		// clarity gem
		var clarity_lvl = $(".cla input[type=number]", this).restricted_val();
		var clarity_mana = clarity_lvl == 0 ? 0 : Math.ceil(Math.floor((40 + (clarity_lvl * 20)) * (rm_gem_multi / 100) * (bm_gem_multi / 100) * (other_multi / 100)) * ((reduced_mana - additional_reduced_mana) / 100) * mortal_conv);
		flat[+ blood_magic] += clarity_mana;
		$(".cla .reserved-mana", this).html(clarity_mana.toString());

		// individual % reserved auras
		$("*[data-reserved]", this).each(function(){
			var reserved_mana = Math.ceil(Math.floor($(this).data("reserved") * (rm_gem_multi / 100) * (bm_gem_multi / 100) * (other_multi / 100)) * ((reduced_mana - additional_reduced_mana) / 100) * mortal_conv);
			if($("input:checked", this).length) {
				perc[+ blood_magic] += reserved_mana;
			}
			$(".reserved", this).html(reserved_mana + "%");
		});
	});

	// update globes
	var life = $("input[name=life]").val();
	var mana = $("input[name=mana]").val();

	var life_r = Math.round(life * (perc[1] / 100)) + flat[1];
	var mana_r = Math.round(mana * (perc[0] / 100)) + flat[0];

	var life_rp = Math.round((life_r / life) * 100);
	var mana_rp = Math.round((mana_r / mana) * 100);

	$("#hp, #mana").removeClass("error");
	if((life - life_r) <= 0) {
		$("#hp").addClass("error");
	}
	if((mana - mana_r) < 0) {
		$("#mana").addClass("error");
	}

	$("#hp .total").html((life - life_r) + "/" + life.toString());
	$("#mana .total").html((mana - mana_r) + "/" + mana.toString());

	$("#hp .reserved").html(life_rp.toString());
	$("#mana .reserved").html(mana_rp.toString());

	$("#hp div").css("height", (life_rp > 100 ? 100 : life_rp) * 2);
	$("#mana div").css("height", (mana_rp > 100 ? 100 : mana_rp) * 2);

	$("#mana").removeClass("blood");
	if($(".bms input:checked").length) {
		$("#mana").addClass("blood");
		$("#mana .total").html("0/0");
		$("#mana .reserved").html("0")
	}
	if(nohash != true) {
		window.location.hash = $("#p").serialize();
	}

	$("label.edited").removeClass("edited");
	$("input[type=number]").each(function(){
		var val = parseInt($(this).val());
		val = isNaN(val) ? 0 : val;
		if(val != parseInt($(this).data('default'))) {
			$(this).parents("label").addClass("edited");
		}
	});
	$("input[type=checkbox]:checked").parents("label").addClass("edited");

}
var activate_aura_group = function(grp){
	$("input", grp).change(recalculate);
	$("input", grp).keyup(recalculate);
	$(".del", grp).click(function(){
		var section = $(this).parents("section");
		if(confirm("Are you sure you want to delete Aura Group " + $("h3 span", section).html() + "?")) {
			section.remove();
		}
		$("input[name=auras]").val($(".aura-grp").length);
		recalculate();
	});

	$(".tog", grp).click(function(){
		$(".collapsible", $(this).parents("section")).slideToggle(200);
	});
}

$().ready(function(){
	var hash = window.location.hash.substr(1);
	$("#skills input").change(recalculate);
	$("#skills input").keyup(recalculate);
	aura_group = $("#aura_1").html();
	activate_aura_group($("#aura_1"));
	$("a[rel=external]").attr("target", "_blank");
	$("#add").click(function(){
		var new_grp_id = $(".aura-grp").length + 1;
		$(".aura-grp:last").after('<section id="aura_' + new_grp_id + '" class="row aura-grp">' + aura_group.replace(/\[1\]/g, "[" + new_grp_id + "]") + "</section>");
		$(".aura-grp:last input[type=text]").val("Aura Group " + new_grp_id.toString());
		$("input[name=auras]").val(new_grp_id);
		activate_aura_group($(".aura-grp:last"));
		recalculate();
	});

	var map = {};

	$.each(hash.split("&"), function () {
		var nv = this.split("="),
			n = decodeURIComponent(nv[0]),
			v = nv.length > 1 ? decodeURIComponent(nv[1]) : null;
		if (!(n in map)) {
			map[n] = [];
		}
		map[n].push(v);
	});

	var auras = parseInt(map['auras']);

	if(auras > 1) {
		for (var i = 0; i < auras - 1; i++) {
			$("#add").click();
		}
	}
	else {
		auras = 1;
	}

	$.each(map, function (n, v) {
		$("[name='" + n + "'][type=text]").val(v.toString().replace(/\+/g, " "));
		$("[name='" + n + "'][type=number]").val(parseInt(v));
		if($("[name='" + n + "'][type=checkbox]").length) {
			$("[name='" + n + "'][type=checkbox]").prop("checked", true);
		}
	});
	console.log(auras <= 1)
	recalculate((auras <= 1))
});