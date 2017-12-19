<?php 
/*
** Zabbix
** Copyright (C) 2001-2017 Zabbix SIA
**
** This program is free software; you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation; either version 2 of the License, or
** (at your option) any later version.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with this program; if not, write to the Free Software
** Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
**/


ob_start(); ?>
var stepsPairManager = (function() {
	'use strict';

	var rowTemplate = new Template(jQuery('#stepPairRow').html()),
		allPairs = {},
		namesMap,
		form;

	function renderPairRow(pair) {
		var	parent,
			target = jQuery(getDomTargetIdForRowInsert(pair.type)),
			pair_row = jQuery(rowTemplate.evaluate({'pair': pair}));

		if (!target.parents('.pair-container').hasClass('pair-container-sortable')) {
			pair_row.find('.<?= ZBX_STYLE_DRAG_ICON ?>').remove();
		}

		target.before(pair_row);

		parent = jQuery(stepsPairManager.form).find('#pairRow_' + pair.id);
		parent.find("input[data-type]").on('change', function() {
			var	target = jQuery(this),
				parent = target.parents('.pairRow'),
				id = parent.data('pairid'),
				pair = allPairs[id];

			pair[target.data('type')] = target.val();
			allPairs[id] = pair;
		});
	}

	function getDomTargetIdForRowInsert(type) {
		return '#' + type.toLowerCase().trim() + '_footer';
	}

	function addPair(pair) {
		for (var name in stepsPairManager.namesMap) {
			if (pair.type === name) {
				pair.type = stepsPairManager.namesMap[name];
			}
		}

		if (pair.isNew === 'true') {
			pair.isNew = true;
		}
		allPairs[pair.id] = pair;
		return pair;
	}

	function createNewPair(typeName, pairName, pairValue) {
		var newPair = {
			isNew: true,
			type: typeName,
			name: pairName,
			value: pairValue
		};

		if (newPair.name === undefined) {
			newPair.name = "";
		}

		if (newPair.value === undefined) {
			newPair.value = "";
		}

		newPair.id = 1;
		while (allPairs[newPair.id] !== void(0)) {
			newPair.id++;
		}

		return addPair(newPair);
	}

	function refreshContainers() {
		jQuery('.pair-container-sortable:not(.disabled)').each(function() {
			jQuery(this).sortable({
				disabled: (jQuery(this).find('tr.sortable').length < 2)
			});
		});
	}

	function moveRowToAnotherTypeTable(pairId, type) {
		jQuery('#pair_type_' + pairId).val(type);
		jQuery('#pairRow_' + pairId).insertBefore(getDomTargetIdForRowInsert(type));

		refreshContainers();
	}

	return {
		add: function(pairs, form, namesMap) {
			stepsPairManager.form = form || null;
			stepsPairManager.namesMap = namesMap || null;

			for (var i = 0; i < pairs.length; i++) {
				renderPairRow(addPair(pairs[i]));
			}

			jQuery('.pair-container', stepsPairManager.form).each(function() {
				var rows = jQuery(this).find('.pairRow').length;
				if (rows === 0) {
					renderPairRow(createNewPair(this.id));
				}
			});

			refreshContainers();
		},

		addNew: function(type, name, value) {
			renderPairRow(createNewPair(type, name, value));
			refreshContainers();
		},

		remove: function(pairId) {
			delete allPairs[pairId];
			refreshContainers();
		},

		removeAll: function(type) {
			var pairs = Object.keys(allPairs);

			for (var p = 0; p < pairs.length; p++) {
				if (allPairs[pairs[p]].type === type) {
					jQuery('#pairRow_' + pairs[p]).remove();
					delete allPairs[pairs[p]];
				}
			}
		},

		setType: function(pairId, type) {
			if (allPairs[pairId].type !== type) {
				moveRowToAnotherTypeTable(pairId, type);
				allPairs[pairId].type = type;
			}
		},

		refresh: function() {
			refreshContainers();
		},

		getPairsByType: function(type) {
			var	pairs = [],
				existingPairs = Object.keys(allPairs);

			for (var p = 0; p < existingPairs.length; p++) {
				if (allPairs[existingPairs[p]].type === type) {
					pairs.push(allPairs[existingPairs[p]]);
				}
			}

			return pairs;
		},

		cleanup: function(type) {
			var pairs = this.getPairsByType(type);

			for (var p = 0; p < pairs.length; p++) {
				if (pairs[p].isNew === true && pairs[p].name === '' && pairs[p].value === '') {
					jQuery('#pairRow_' + pairs[p].id).remove();
					delete allPairs[pairs[p].id];
				}
			}
		},

		merge: function (pairs) {
			var	pair,
				queryFields = [],
				existingPairs = Object.keys(allPairs);

			if (pairs.length > 0) {
				this.cleanup('query_fields');
			}

			for (var p = 0; p < existingPairs.length; p++) {
				if (allPairs[existingPairs[p]] !== undefined &&
					allPairs[existingPairs[p]].type === 'query_fields' &&
					allPairs[existingPairs[p]].name.indexOf('[]') === -1) {
					queryFields.push(allPairs[existingPairs[p]]);
				}
			}

			for (var i = 0; i < pairs.length; i++) {
				pair = null;
				for (var p = 0; p < queryFields.length; p++) {
					if (queryFields[p].name === pairs[i].name) {
						pair = queryFields[p];
						break;
					}
				}

				if (pair === null) {
					renderPairRow(createNewPair('query_fields', pairs[i].name, pairs[i].value));
				}
				else {
					jQuery('#pair_value_' + pair.id).val(pairs[i].value);
				}
			}

			refreshContainers();
		}
	};
}());

function parseUrl() {
	var i,
		query,
		index,
		fields,
		pair,
		hasErrors = false,
		pairs = [],
		target = jQuery("#url"),
		url = target.val();

	index = url.indexOf("#");
	if (index !== -1)
		url = url.substring(0, index);

	index = url.indexOf("?");
	if (index !== -1) {
		query = url.substring(index + 1);
		url = url.substring(0, index);

		fields = query.split('&');
		for (i = 0; i < fields.length; i++) {
			if (fields[i].length === 0 || fields[i] === '=')
				continue;

			pair = {};
			index = fields[i].indexOf("=");
			if (index > 0) {
				pair.name = fields[i].substring(0, index);
				pair.value = fields[i].substring(index + 1);
			}
			else {
				if (index === 0) {
					fields[i] = fields[i].substring(1);
				}
				pair.name = fields[i];
				pair.value = "";
			}

			try {
				if (/%[01]/.match(pair.name) || /%[01]/.match(pair.value) ) {
					throw null; /* non-printable characters in URL */
				}
				pair.name = decodeURIComponent(pair.name.replace(/\+/g,  " "));
				pair.value = decodeURIComponent(pair.value.replace(/\+/g,  " "));
			}
			catch( e ) {
				/* malformed url */
				hasErrors = true;
				break;
			}

			pairs.push(pair);
		}

		if (true === hasErrors) {
			overlayDialogue({
				'title': <?= CJs::encodeJson(_('Error')); ?>,
				'content': jQuery('<span>').html(<?=
					CJs::encodeJson(_('Failed to parse URL.').'<br><br>'._('URL is not properly encoded.'));
				?>),
				'buttons': [
					{
						title: <?= CJs::encodeJson(_('Ok')); ?>,
						class: 'btn-alt',
						focused: true,
						action: function() {}
					}
				]
			});

			return false;
		}

		stepsPairManager.merge(pairs);
	}

	target.val(url);
}

function setPostType(type) {
	if (type == <?= ZBX_POSTTYPE_FORM ?>) {
		jQuery('#post_fields_row').css("display", 'table-row');
		jQuery('#post_raw_row').css("display", "none");
	}
	else {
		jQuery('#post_fields_row').css("display", "none");
		jQuery('#post_raw_row').css("display", 'table-row');
	}

	jQuery('input[name="post_type"][value="' + type + '"]').prop("checked", true);
}

function switchToPostType(type) {
	if (type == <?= ZBX_POSTTYPE_FORM ?>) {
		var	posts = jQuery('#posts').val(),
			fields,
			parts,
			pair,
			pairs = [];

		if (posts !== '') {
			fields = posts.split('&');

			try {
				for (var i = 0; i < fields.length; i++) {
					parts = fields[i].split('=');
					if (parts.length === 1) {
						parts.push('');
					}

					pair = {};
					try {
						if (parts.length > 2) {
							throw null;
						}

						if (/%[01]/.match(parts[0]) || /%[01]/.match(parts[1]) ) {
							throw null; /* non-printable characters in data */
						}

						pair.name = decodeURIComponent(parts[0].replace(/\+/g, " "));
						pair.value = decodeURIComponent(parts[1].replace(/\+/g, " "));
					}
					catch(e) {
						throw <?= CJs::encodeJson(_('Data is not properly encoded.')); ?>;
					}

					if (pair.name === '') {
						throw <?= CJs::encodeJson(_('Values without names are not allowed in form fields.')); ?>;
					}

					if (pair.name.length > 255) {
						throw <?= CJs::encodeJson(_('Name of the form field should not exceed 255 characters.')); ?>;
					}

					pairs.push(pair);
				}
			}
			catch(e) {
				jQuery('input[name="post_type"][value="<?= ZBX_POSTTYPE_RAW ?>"]').prop("checked", true);

				overlayDialogue({
					'title': <?= CJs::encodeJson(_('Error')); ?>,
					'content': jQuery('<span>').html(<?=
						CJs::encodeJson(
							_('Cannot convert POST data from raw data format to form field data format.').'<br><br>'
						); ?> + e),
					'buttons': [
						{
							title: <?= CJs::encodeJson(_('Ok')); ?>,
							class: 'btn-alt',
							focused: true,
							action: function() {}
						}
					]
				});

				return false;
			}
		}

		stepsPairManager.removeAll('post_fields');
		for (var i = 0; i < pairs.length; i++) {
			stepsPairManager.addNew('post_fields', pairs[i].name, pairs[i].value);
		}
		stepsPairManager.refresh();
	}
	else {
		var fields = [],
			parts,
			pairs = stepsPairManager.getPairsByType('post_fields');

		for (var p = 0; p < pairs.length; p++) {
			parts = [];
			if (pairs[p].name !== '') {
				parts.push(encodeURIComponent(pairs[p].name.replace(/'/g,"%27").replace(/"/g,"%22")));
			}
			if (pairs[p].value !== '') {
				parts.push(encodeURIComponent(pairs[p].value.replace(/'/g,"%27").replace(/"/g,"%22")));
			}
			if (parts.length > 0) {
				fields.push(parts.join('='));
			}
		}

		jQuery('#posts').val(fields.join('&'));
	}

	setPostType(type);
}

jQuery(document).ready(function() {
	'use strict';

	jQuery('#scenarioStepTab').on('click', 'button.remove', function() {
		var pairId = jQuery(this).data('pairid');
		jQuery('#pairRow_' + pairId).remove();
		stepsPairManager.remove(pairId);
	});

	jQuery('.pair-container-sortable').sortable({
		disabled: (jQuery(this).find('tr.sortable').length < 2),
		items: 'tr.sortable',
		axis: 'y',
		cursor: 'move',
		containment: 'parent',
		handle: 'div.<?= ZBX_STYLE_DRAG_ICON ?>',
		tolerance: 'pointer',
		opacity: 0.6,
		helper: function(e, ui) {
			return ui;
		},
		start: function(e, ui) {
			$(ui.placeholder).height($(ui.helper).height());
		}
	});

	jQuery('.pairs-control-add', jQuery('#scenarioStepTab')).on('click', function() {
		stepsPairManager.addNew(jQuery(this).data('type'));
	});

	jQuery(function() {
		jQuery('#retrieve_mode')
			.on('change', function() {
				jQuery('#post_fields').toggleClass('disabled',this.checked);
				jQuery('#required, #posts, #post_fields input[type="text"], #post_fields .btn-link, #post_type input').attr('disabled', this.checked);

				if (this.checked === false) {
					stepsPairManager.refresh();
				}
			})
			.trigger('change');
	});
});

function add_var_to_opener_obj(obj, name, value) {
	var input = window.document.createElement('input');

	input.value = value;
	input.type = 'hidden';
	input.name = name;
	obj.appendChild(input);
}

function addPairsToOpenerObject(obj, name, stepPairs) {
	var prefix,
		keys,
		pairs,
		inputs;

	name += '[pairs]';
	inputs = jQuery(window.document).find('input[name^="' + name + '"]');
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].remove();
	}

	pairs = Object.keys(stepPairs);
	for (var i = 0; i < pairs.length; i++) {
		if (!/[0-9]+/.match(pairs[i])) {
			continue;
		}

		pair = stepPairs[pairs[i]];
		prefix = name + '[' + pair.id + ']';

		/* empty values are ignored */
		if (pair.name === undefined || (pair.isNew !== undefined && pair.name === '' && pair.value === '')) {
			continue;
		}

		keys = Object.keys(pair);
		for (var p = 0; p < keys.length; p++) {
			add_var_to_opener_obj(obj, prefix + '[' + keys[p] + ']', pair[keys[p]]);
		}
	}
}

function add_httpstep(formname, httpstep) {
	var form = window.document.forms[formname];
	if (!form) {
		return false;
	}

	add_var_to_opener_obj(form, 'new_httpstep[name]', httpstep.name);
	add_var_to_opener_obj(form, 'new_httpstep[timeout]', httpstep.timeout);
	add_var_to_opener_obj(form, 'new_httpstep[url]', httpstep.url);
	add_var_to_opener_obj(form, 'new_httpstep[posts]', httpstep.posts);
	add_var_to_opener_obj(form, 'new_httpstep[post_type]', httpstep.post_type);
	add_var_to_opener_obj(form, 'new_httpstep[required]', httpstep.required);
	add_var_to_opener_obj(form, 'new_httpstep[status_codes]', httpstep.status_codes);
	add_var_to_opener_obj(form, 'new_httpstep[follow_redirects]', httpstep.follow_redirects);
	add_var_to_opener_obj(form, 'new_httpstep[retrieve_mode]', httpstep.retrieve_mode);

	addPairsToOpenerObject(form, 'new_httpstep', httpstep.pairs);

	form.submit();
	return true;
}

function update_httpstep(formname, list_name, httpstep) {
	var prefix,
		form = window.document.forms[formname];

	if (!form) {
		return false;
	}

	prefix = list_name + '[' + httpstep.stepid + ']';

	add_var_to_opener_obj(form, prefix + '[name]', httpstep.name);
	add_var_to_opener_obj(form, prefix + '[timeout]', httpstep.timeout);
	add_var_to_opener_obj(form, prefix + '[url]', httpstep.url);
	add_var_to_opener_obj(form, prefix + '[posts]', httpstep.posts);
	add_var_to_opener_obj(form, prefix + '[post_type]', httpstep.post_type);
	add_var_to_opener_obj(form, prefix + '[required]', httpstep.required);
	add_var_to_opener_obj(form, prefix + '[status_codes]', httpstep.status_codes);
	add_var_to_opener_obj(form, prefix + '[follow_redirects]', httpstep.follow_redirects);
	add_var_to_opener_obj(form, prefix + '[retrieve_mode]', httpstep.retrieve_mode);

	addPairsToOpenerObject(form, prefix, httpstep.pairs);
	form.submit();
	return true;
}
<?php return ob_get_clean(); ?>