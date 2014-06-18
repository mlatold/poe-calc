/* This restricts fetched input fields to their min/max attributes */
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

/* This recalculates everything on the page all in one go */
var recalculate = function(nohash) {
	// index 0 is mana, 1 is life
	var flat = [0, 0];
	var perc = [0, 0];

	// Blood magic convocation skill only allowed if blood magic is checked
	$(".mcs").removeClass("disabled");
	$(".mcs input").prop("disabled", false);
	if(!$("input[name=bms]:checked").length) {
		$(".mcs").addClass("disabled");
		$(".mcs input").prop("checked", false);
		$(".mcs input").prop("disabled", true);
	}
	// Midnight Bargain x2 (if midnight bargain 1 is checked)
	$(".mi2").removeClass("disabled");
	$(".mi2 input").prop("disabled", false);
	if(!$("input[name=mid]:checked").length) {
		$(".mi2").addClass("disabled");
		$(".mi2 input").prop("checked", false);
		$(".mi2 input").prop("disabled", true);
	}

	// setting advanced settings back to default
	$(".advanced").hide();
	if($(".adv input:checked").length) {
		$(".advanced").show();
		$(".advanced").css("display", "block");
	}
	else {
		$(".emp input").prop("checked", false);

		$(".alh input").prop("checked", false);
		$(".bma input").prop("checked", false);
		$(".mul input").val("100");
	}

	// Skill tree
	var reduced_mana = ($(".rms input[type=number]").restricted_val() - 100) * -1;
	var mortal_conv = $(".mcs input:checked").length ? .6 : 1;

	// Alpha's howl
	reduced_mana -= $(".alp input:checked").length ? 8 : 0;

	// Midnight Bargain
	perc[1] += $(".mid input:checked").length ? 30 : 0;
	perc[1] += $(".mi2 input:checked").length ? 30 : 0;

	/* Aura groups are meant to be as "links" so users can combine different variables applicable only to
		specific auras, so a lot of math has to be done seperately here */
	$(".aura-grp").each(function() {
		// blood magic gem
		var bm_gem_multipliers = [2.45, 2.42, 2.39, 2.37, 2.34, 2.32, 2.29, 2.26, 2.24, 2.21, 2.18, 2.16, 2.13, 2.11, 2.08, 2.05, 2.03, 2.00, 1.97, 1.96, 1.93];
		var bm_gem_lvl = $(".bmg input[type=number]", this).restricted_val();
		var bm_gem_multi = bm_gem_lvl == 0 ? 100 : Math.ceil(bm_gem_multipliers[bm_gem_lvl - 1] * 100);
		$(".bmg .multi", this).html("x" + bm_gem_multi.toString() + "%");

		// is blood magic on?
		var blood_magic = ($(".bms input:checked").length || $(".bma input:checked", this).length || bm_gem_lvl) ? true : false;

		var other_multi = $(".mul input[type=number]", this).restricted_val();
		other_multi *= $(".emp input:checked", this).length ? 1.25 : 1;

		// reduced mana gem
		var rm_gem_lvl = $(".rmg input[type=number]", this).restricted_val();
		var rm_gem_multi = rm_gem_lvl == 0 ? 100 : 91 - rm_gem_lvl;
		$(".rmg .multi", this).html("x" + rm_gem_multi.toString() + "%");

		// additional rediced mana (for things like alphas howl or prism guardian) only takes effect for this aura group
		var additional_reduced_mana = 0;
		if($(".prg input:checked", this).length) {
			additional_reduced_mana = 25;
			blood_magic = true;
		}

		// Alpha's howl for snapshotting
		additional_reduced_mana += $(".alh input:checked", this).length ? 8 : 0;

		/* Note: The calculation is a bit of a mess but it's from here:
			http://www.pathofexile.com/forum/view-thread/567561/page/3

			Mark GGG on that page describes the aura calculations working this way
			so I've done my best to emulate it
		*/
		var calculate_aura = function(aura) {
			return Math.floor(Math.ceil(Math.floor(aura * (rm_gem_multi / 100) * (bm_gem_multi / 100) * (other_multi / 100)) * ((reduced_mana - additional_reduced_mana) / 100)) * mortal_conv);
		}

		// clarity gem
		var clarity_lvl = $(".cla input[type=number]", this).restricted_val();
		var clarity_mana = clarity_lvl == 0 ? 0 : calculate_aura(40 + (clarity_lvl * 20));
		flat[+ blood_magic] += clarity_mana;
		$(".cla .reserved-mana", this).html(clarity_mana.toString());

		// individual % reserved auras
		$("*[data-reserved]", this).each(function(){
			var reserved_mana = calculate_aura($(this).data("reserved"));
			if($("input:checked", this).length) {
				perc[+ blood_magic] += reserved_mana;
			}
			$(".reserved", this).html(reserved_mana + "%");
		});
	});

	/* Update globes */
	var life = $("input[name=life]").val();
	var mana = $("input[name=mana]").val();

	var life_reserved_numeric = Math.round(life * (perc[1] / 100)) + flat[1];
	var mana_reserved_numeric = Math.round(mana * (perc[0] / 100)) + flat[0];

	var life_reserved_percent = Math.floor((life_reserved_numeric / life) * 100);
	var mana_reserved_percent = Math.floor((mana_reserved_numeric / mana) * 100);

	$("#hp, #mana").removeClass("error");
	if((life - life_reserved_numeric) <= 0) {
		$("#hp").addClass("error");
	}
	if((mana - mana_reserved_numeric) < 0) {
		$("#mana").addClass("error");
	}

	$("#hp_f .total, #hp .total").html((life - life_reserved_numeric) + "/" + life.toString());
	$("#mana_f .total, #mana .total").html((mana - mana_reserved_numeric) + "/" + mana.toString());

	$("#hp_f .reserved, #hp .reserved").html(life_reserved_percent.toString());
	$("#mana_f .reserved, #mana .reserved").html(mana_reserved_percent.toString());

	$("#hp div").css("height", (life_reserved_percent > 100 ? 100 : life_reserved_percent) * 2);
	$("#mana div").css("height", (mana_reserved_percent > 100 ? 100 : mana_reserved_percent) * 2);

	// remove all mana if blood magic
	$("#mana").removeClass("blood");
	if($(".bms input:checked").length) {
		$("#mana").addClass("blood");
		$("#mana_f .total, #mana .total").html("0/0");
		$("#mana_f .reserved, #mana .reserved").html("0")
	}
	// saves current state of form to url
	if(nohash != true) {
		location.replace("#" + $("#p").serialize());
	}
	// highlight edited fields
	$("label.edited").removeClass("edited");
	$("input[type=number]").each(function(){
		var val = parseInt($(this).val());
		val = isNaN(val) ? 0 : val;
		if(val != parseInt($(this).data('default'))) {
			$(this).parents("label").addClass("edited");
		}
	});
	$("input[type=checkbox]:checked").parents("label").addClass("edited");

	// adds "selected" class so people know they've already selected something
	$("label.selected").removeClass("selected");
	$("*[data-reserved] input:checked").each(function(){
		var name = $(this).attr("name").replace(/\[[0-9]*\]/, "");
		$("label." + name + ":not(.edited)").addClass("selected");
	});
	if($(".cla.edited").length) {
		$(".cla:not(.edited)").addClass("selected");
	}
}

/* Activates a new aura group for functionality */
var activate_aura_group = function(grp){
	$("input", grp).change(recalculate);
	$("input", grp).keyup(recalculate);
	$(".del", grp).click(function(){
		var section = $(this).parents("section");
		if(confirm("Are you sure you want to delete: \"" + $("h3 input[type=text]", section).val() + "\"?")) {
			section.remove();
			$("input[name=auras]").val($(".aura-grp").length);
			recalculate();
		}
	});

	$(".tog", grp).click(function(){
		$(".collapsible", $(this).parents("section")).slideToggle(200);
	});
}

/* Initialize */
var aura_group = "";
var access_token = '887ecbfea2063ee8f9623a50ba6d08ffc0104a50';

$().ready(function(){
	var hash = window.location.hash.substr(1).replace(/&amp;/g, "&");

	$("#skills input").change(recalculate);
	$("#skills input").keyup(recalculate);
	aura_group = $("#aura_1").html();
	activate_aura_group($("#aura_1"));
	$("a[rel=external]").attr("target", "_blank");
	//add button
	$("#add").click(function(){
		var new_grp_id = $(".aura-grp").length + 1;
		$(".aura-grp:last").after('<section id="aura_' + new_grp_id + '" class="row aura-grp">' + aura_group.replace(/\[1\]/g, "[" + new_grp_id + "]") + "</section>");
		$(".aura-grp:last input[type=text]").val("Aura Group " + new_grp_id.toString());
		$("input[name=auras]").val(new_grp_id);
		activate_aura_group($(".aura-grp:last"));
		recalculate();
		$(this).blur();
		return false;
	});
	// reset button
	$("#reset").click(function() {
		if(confirm("Are you sure you want to reset the entire form?")) {
			$(".aura-grp:gt(0)").remove();
			$("input[type=checkbox]").prop("checked", false);
			$(".aura-grp input[type=text]").val("Aura Group 1");
			$("input[type=number]").each(function(){
				$(this).val($(this).data('default') == 0 ? "" : $(this).data('default'));
			});
			$("input[type=number][name=rms]").val("0");

			recalculate();
			location.replace("#");
		}
		$(this).blur();
		return false;
	});
	// Bit.ly link generator
	$("#bitly").click(function(){
		$(this).blur();
		$("#bitly_text").val("Fetching URL...");
		$.getJSON(
			'https://api-ssl.bitly.com/v3/shorten?access_token=' + access_token + '&longUrl=' + encodeURIComponent(document.URL), {},
			function(json){
				$("#bitly_text").val(json.data.url);
			}
		);
	});

	// loading variables from the hash in the url
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

	recalculate((auras <= 1));
});