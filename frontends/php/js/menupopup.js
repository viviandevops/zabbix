/*
** Zabbix
** Copyright (C) 2001-2018 Zabbix SIA
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


/**
 * Get menu popup history section data.
 *
 * @param string options['itemid']           Item ID.
 * @param bool   options['hasLatestGraphs']  Link to history page with showgraph action (optional).
 *
 * @return array
 */
function getMenuPopupHistory(options) {
	var items = [],
		url = new Curl('history.php');

	url.setArgument('itemids[]', options.itemid);

	if (typeof options.fullscreen !== 'undefined' && options.fullscreen) {
		url.setArgument('fullscreen', '1');
	}

	// latest graphs
	if (typeof options.hasLatestGraphs !== 'undefined' && options.hasLatestGraphs) {
		url.setArgument('action', 'showgraph');

		url.setArgument('period', '3600');
		items.push({
			label: t('Last hour graph'),
			url: url.getUrl()
		});

		url.setArgument('period', '604800');
		items.push({
			label: t('Last week graph'),
			url: url.getUrl()
		});

		url.setArgument('period', '2678400');
		items.push({
			label: t('Last month graph'),
			url: url.getUrl()
		});
	}

	// latest values
	url.setArgument('action', 'showvalues');
	url.setArgument('period', '3600');
	items.push({
		label: t('Latest values'),
		url: url.getUrl()
	});

	return [{
		label: t('History'),
		items: items
	}];
}

/**
 * Get menu popup host section data.
 *
 * @param string options['hostid']          Host ID.
 * @param array  options['scripts']         Host scripts (optional).
 * @param string options[]['name']          Script name.
 * @param string options[]['scriptid']      Script ID.
 * @param string options[]['confirmation']  Confirmation text.
 * @param bool   options['showGraphs']      Link to host graphs page.
 * @param bool   options['showScreens']     Link to host screen page.
 * @param bool   options['showTriggers']    Link to Monitoring->Problems page.
 * @param bool   options['hasGoTo']         "Go to" block in popup.
 * @param bool   options['fullscreen']      Fullscreen mode.
 * @param {object} trigger_elmnt            UI element which triggered opening of overlay dialogue.
 *
 * @return array
 */
function getMenuPopupHost(options, trigger_elmnt) {
	var sections = [];

	// scripts
	if (typeof options.scripts !== 'undefined') {
		sections.push({
			label: t('Scripts'),
			items: getMenuPopupScriptData(options.scripts, options.hostid, trigger_elmnt)
		});
	}

	// go to section
	if (options.hasGoTo) {
		var fullscreen = (typeof options.fullscreen !== 'undefined' && options.fullscreen),
			// inventory
			host_inventory = {
				label: t('Host inventory')
			},
			host_inventory_url = new Curl('hostinventories.php'),
			// latest
			latest_data = {
				label: t('Latest data')
			},
			latest_data_url = new Curl('latest.php'),
			// problems
			problems = {
				label: t('Problems')
			},
			// graphs
			graphs = {
				label: t('Graphs')
			},
			// screens
			screens = {
				label: t('Host screens')
			};

		// inventory link
		host_inventory_url.setArgument('hostid', options.hostid);
		if (fullscreen) {
			host_inventory_url.setArgument('fullscreen', '1');
		}
		host_inventory.url = host_inventory_url.getUrl();

		// latest data link
		latest_data_url.setArgument('hostids[]', options.hostid);
		latest_data_url.setArgument('filter_set', '1');
		if (fullscreen) {
			latest_data_url.setArgument('fullscreen', '1');
		}
		latest_data.url = latest_data_url.getUrl();

		if (!options.showTriggers) {
			problems.disabled = true;
		}
		else {
			var url = new Curl('zabbix.php');
			url.setArgument('action', 'problem.view');
			url.setArgument('filter_hostids[]', options.hostid);
			url.setArgument('filter_set', '1');
			if (fullscreen) {
				url.setArgument('fullscreen', '1');
			}
			problems.url = url.getUrl();
		}

		if (!options.showGraphs) {
			graphs.disabled = true;
		}
		else {
			var graphs_url = new Curl('charts.php');

			graphs_url.setArgument('hostid', options.hostid);
			if (fullscreen) {
				graphs_url.setArgument('fullscreen', '1');
			}
			graphs.url = graphs_url.getUrl();
		}

		if (!options.showScreens) {
			screens.disabled = true;
		}
		else {
			var screens_url = new Curl('host_screen.php');

			screens_url.setArgument('hostid', options.hostid);
			if (fullscreen) {
				screens_url.setArgument('fullscreen', '1');
			}
			screens.url = screens_url.getUrl();
		}

		sections.push({
			label: t('Go to'),
			items: [
				host_inventory,
				latest_data,
				problems,
				graphs,
				screens
			]
		});
	}

	return sections;
}

/**
 * Get menu popup map section data.
 *
 * @param string options['hostid']                  Host ID.
 * @param array  options['scripts']                 Host scripts (optional).
 * @param string options[]['name']                  Script name.
 * @param string options[]['scriptid']              Script ID.
 * @param string options[]['confirmation']          Confirmation text.
 * @param object options['gotos']                   Links section (optional).
 * @param array  options['gotos']['latestData']     Link to latest data page.
 * @param array  options['gotos']['inventory']      Link to host inventory page.
 * @param array  options['gotos']['graphs']         Link to host graph page with url parameters ("name" => "value").
 * @param array  options['gotos']['showGraphs']     Display "Graphs" link enabled or disabled.
 * @param array  options['gotos']['screens']        Link to host screen page with url parameters ("name" => "value").
 * @param array  options['gotos']['showScreens']    Display "Screens" link enabled or disabled.
 * @param array  options['gotos']['triggerStatus']  Link to "Problems" page with url parameters ("name" => "value").
 * @param array  options['gotos']['showTriggers']   Display "Problems" link enabled or disabled.
 * @param array  options['gotos']['submap']         Link to submap page with url parameters ("name" => "value").
 * @param array  options['gotos']['events']         Link to events page with url parameters ("name" => "value").
 * @param array  options['gotos']['showEvents']     Display "Events" link enabled or disabled.
 * @param array  options['urls']                    Local and global map link (optional).
 * @param string options['url'][]['label']          Link label.
 * @param string options['url'][]['url']            Link url.
 * @param bool   options['fullscreen']              Fullscreen mode.
 * @param {object} trigger_elmnt                    UI element which triggered opening of overlay dialogue.
 *
 * @return array
 */
function getMenuPopupMap(options, trigger_elmnt) {
	var sections = [];

	// scripts
	if (typeof options.scripts !== 'undefined') {
		sections.push({
			label: t('Scripts'),
			items: getMenuPopupScriptData(options.scripts, options.hostid, trigger_elmnt)
		});
	}

	/*
	 * Gotos section
	 */
	if (typeof options.gotos !== 'undefined') {
		var gotos = [],
			fullscreen = (typeof options.fullscreen !== 'undefined' && options.fullscreen);

		// inventory
		if (typeof options.gotos.inventory !== 'undefined') {
			var url = new Curl('hostinventories.php');
			if (fullscreen) {
				url.setArgument('fullscreen', '1');
			}

			jQuery.each(options.gotos.inventory, function(name, value) {
				if (value !== null) {
					url.setArgument(name, value);
				}
			});

			gotos.push({
				label: t('Host inventory'),
				url: url.getUrl()
			});
		}

		// latest
		if (typeof options.gotos.latestData !== 'undefined') {
			var url = new Curl('latest.php');
			url.setArgument('filter_set', '1');
			if (fullscreen) {
				url.setArgument('fullscreen', '1');
			}

			jQuery.each(options.gotos.latestData, function(name, value) {
				if (value !== null) {
					url.setArgument(name, value);
				}
			});

			gotos.push({
				label: t('Latest data'),
				url: url.getUrl()
			});
		}

		// problems
		if (typeof options.gotos.triggerStatus !== 'undefined') {
			var problems = {
				label: t('Problems')
			};

			if (!options.gotos.showTriggers) {
				problems.disabled = true;
			}
			else {
				var url = new Curl('zabbix.php');
				url.setArgument('action', 'problem.view');
				url.setArgument('filter_maintenance', '1');
				url.setArgument('filter_set', '1');
				if (fullscreen) {
					url.setArgument('fullscreen', '1');
				}

				jQuery.each(options.gotos.triggerStatus, function(name, value) {
					if (value !== null) {
						url.setArgument(name, value);
					}
				});

				problems.url = url.getUrl();
			}

			gotos.push(problems);
		}

		// graphs
		if (typeof options.gotos.graphs !== 'undefined') {
			var graphs = {
				label: t('Graphs')
			};

			if (!options.gotos.showGraphs) {
				graphs.disabled = true;
			}
			else {
				var url = new Curl('charts.php');
				if (fullscreen) {
					url.setArgument('fullscreen', '1');
				}

				jQuery.each(options.gotos.graphs, function(name, value) {
					if (value !== null) {
						url.setArgument(name, value);
					}
				});

				graphs.url = url.getUrl();
			}

			gotos.push(graphs);
		}

		// screens
		if (typeof options.gotos.screens !== 'undefined') {
			var screens = {
				label: t('Host screens')
			};

			if (!options.gotos.showScreens) {
				screens.disabled = true;
			}
			else {
				var url = new Curl('host_screen.php');
				if (fullscreen) {
					url.setArgument('fullscreen', '1');
				}

				jQuery.each(options.gotos.screens, function(name, value) {
					if (value !== null) {
						url.setArgument(name, value);
					}
				});

				screens.url = url.getUrl();
			}

			gotos.push(screens);
		}

		// submap
		if (typeof options.gotos.submap !== 'undefined') {
			var url = new Curl('zabbix.php');
			url.setArgument('action', 'map.view');

			jQuery.each(options.gotos.submap, function(name, value) {
				if (value !== null) {
					url.setArgument(name, value);
				}
			});

			if (fullscreen) {
				url.setArgument('fullscreen', '1');
			}

			gotos.push({
				label: t('Submap'),
				url: url.getUrl()
			});
		}
		else if (typeof options.navigatetos !== 'undefined'
			&& typeof options.navigatetos.submap.widget_uniqueid !== 'undefined') {

			var url = new Curl('javascript: navigateToSubmap('+options.navigatetos.submap.sysmapid+', "'+
				options.navigatetos.submap.widget_uniqueid+'");');

			url.unsetArgument('sid');

			gotos.push({
				label: t('Submap'),
				url: url.getUrl()
			});
		}

		// events
		if (typeof options.gotos.events !== 'undefined') {
			var events = {
				label: t('Problems')
			};

			if (!options.gotos.showEvents) {
				events.disabled = true;
			}
			else {
				var url = new Curl('zabbix.php');
				url.setArgument('action', 'problem.view');
				url.setArgument('filter_triggerids[]', options.gotos.events.triggerids);
				url.setArgument('filter_set', '1');
				url.unsetArgument('sid');
				if (typeof options.gotos.events.severity_min !== 'undefined') {
					url.setArgument('filter_severity', options.gotos.events.severity_min);
				}
				if (fullscreen) {
					url.setArgument('fullscreen', '1');
				}

				events.url = url.getUrl();
			}

			gotos.push(events);
		}

		sections.push({
			label: t('Go to'),
			items: gotos
		});
	}

	// urls
	if (typeof options.urls !== 'undefined') {
		sections.push({
			label: t('URLs'),
			items: options.urls
		});
	}

	return sections;
}

/**
 * Get menu popup refresh section data.
 *
 * @param string   options['widgetName']   Widget name.
 * @param string   options['currentRate']  Current rate value.
 * @param bool     options['multiplier']   Multiplier or time mode.
 * @param array    options['params']       Url parameters (optional).
 * @param callback options['callback']     Callback function on success (optional).
 *
 * @return array
 */
function getMenuPopupRefresh(options) {
	var items = [],
		params = (typeof options.params === 'undefined' || options.params.length == 0) ? {} : options.params,
		intervals = options.multiplier
			? {
				'x0.25': 'x0.25',
				'x0.5': 'x0.5',
				'x1': 'x1',
				'x1.5': 'x1.5',
				'x2': 'x2',
				'x3': 'x3',
				'x4': 'x4',
				'x5': 'x5'
			}
			: {
				0: t('No refresh'),
				10: t('10 seconds'),
				30: t('30 seconds'),
				60: t('1 minute'),
				120: t('2 minutes'),
				600: t('10 minutes'),
				900: t('15 minutes')
			};

	jQuery.each(intervals, function(value, label) {
		var item = {
			label: label,
			data: {
				value: value
			},
			clickCallback: function() {
				var obj = jQuery(this),
					currentRate = obj.data('value');

				// it is a quick solution for slide refresh multiplier, should be replaced with slide.refresh or similar
				if (options.multiplier) {
					sendAjaxData('slides.php', {
						data: jQuery.extend({}, params, {
							widgetName: options.widgetName,
							widgetRefreshRate: currentRate
						}),
						dataType: 'script',
						success: function(js) { js }
					});

					jQuery('a', obj.closest('.action-menu')).each(function() {
						var link = jQuery(this);

						if (link.data('value') == currentRate) {
							link
								.addClass('selected')
								.attr('aria-label', sprintf(t('%1$s, selected'), link.data('aria-label')));
						}
						else {
							link
								.removeClass('selected')
								.attr('aria-label', link.data('aria-label'));
						}
					});

					obj.closest('.action-menu').menuPopup('close', null);
				}
				else {
					var url = new Curl('zabbix.php');

					url.setArgument('action', 'dashboard.widget.rfrate');

					jQuery.ajax({
						url: url.getUrl(),
						method: 'POST',
						dataType: 'json',
						data: {
							'widgetid': options.widgetName,
							'rf_rate': currentRate
						},
						success: function(resp) {
							jQuery('a', obj.closest('.action-menu')).each(function() {
								var link = jQuery(this);

								if (link.data('value') == currentRate) {
									link
										.addClass('selected')
										.attr('aria-label', sprintf(t('%1$s, selected'), link.data('aria-label')));
								}
								else {
									link
										.removeClass('selected')
										.attr('aria-label', link.data('aria-label'));
								}
							});

							obj.closest('.action-menu').menuPopup('close', null);

							jQuery('.dashbrd-grid-widget-container')
								.dashboardGrid('setWidgetRefreshRate', options.widgetName, parseInt(currentRate));
						},
						error: function() {
							obj.closest('.action-menu').menuPopup('close', null);
							// TODO: gentle message about failed saving of widget refresh rate
						}
					});
				}
			}
		};

		if (value == options.currentRate) {
			item.selected = true;
		}

		items[items.length] = item;
	});

	return [{
		label: options.multiplier ? t('Refresh interval multiplier') : t('Refresh interval'),
		items: items
	}];
}

function getMenuPopupDashboard(options, trigger_elmnt) {
	jQuery.map(options.items, function(item, key) {
		switch (key) {
			case 'sharing':
				if (!item.disabled) {
					item.clickCallback = function () {
						var options = {'dashboardid': item.form_data.dashboardid};
						PopUp('dashboard.share.edit', options, 'dashboard_share', trigger_elmnt);

						jQuery(this).closest('.action-menu').menuPopup('close', null);
					}
				}
				break;

			case 'delete':
				if (!item.disabled) {
					item.clickCallback = function () {
						var	obj = jQuery(this);

						// hide menu
						obj.closest('.action-menu').hide();

						if (!confirm(item.confirmation)) {
							return false;
						}

						redirect(item.redirect, 'post', 'sid', true);
					}
				}
				break;
		}
		return item;
	});
	return [{label: options.label, items: options.items}];
}

/**
 * Get menu popup trigger section data.
 *
 * @param string options['triggerid']               Trigger ID.
 * @param object options['items']                   Link to trigger item history page (optional).
 * @param string options['items'][]['name']         Item name.
 * @param object options['items'][]['params']       Item url parameters ("name" => "value").
 * @param object options['acknowledge']             Link to acknowledge page (optional).
 * @param string options['acknowledge']['eventid']  Event ID
 * @param string options['acknowledge']['backurl']  Return url.
 * @param object options['configuration']           Link to trigger configuration page (optional).
 * @param bool	 options['show_description']		Show Description item in context menu. Default: true.
 * @param bool	 options['description_enabled']		Show Description item enabled. Default: true.
 * @param string options['url']                     Trigger url link (optional).
 * @param bool   options['fullscreen']              Fullscreen mode.
 *
 * @return array
 */
function getMenuPopupTrigger(options) {
	var sections = [],
		items = [],
		fullscreen = (typeof options.fullscreen !== 'undefined' && options.fullscreen);

	// events
	var events = {
		label: t('Problems')
	};

	if (typeof options.showEvents !== 'undefined' && options.showEvents) {
		var url = new Curl('zabbix.php');
		url.setArgument('action', 'problem.view');
		url.setArgument('filter_triggerids[]', options.triggerid);
		url.setArgument('filter_set', '1');
		url.unsetArgument('sid');

		if (fullscreen) {
			url.setArgument('fullscreen', '1');
		}

		events.url = url.getUrl();
	}
	else {
		events.disabled = true;
	}

	items[items.length] = events;

	// acknowledge
	if (typeof options.acknowledge !== 'undefined' && objectSize(options.acknowledge) > 0) {
		var url = new Curl('zabbix.php');

		url.setArgument('action', 'acknowledge.edit');
		url.setArgument('eventids[]', options.acknowledge.eventid);
		url.setArgument('backurl', options.acknowledge.backurl);

		items[items.length] = {
			label: t('Acknowledge'),
			url: url.getUrl()
		};
	}

	// description
	if (typeof options.show_description === 'undefined' || options.show_description !== false) {
		var trigger_descr = {
			label: t('Description')
		};

		if (typeof options.description_enabled === 'undefined' || options.description_enabled !== false) {
			trigger_descr.clickCallback = function(event) {
				jQuery(this).closest('.action-menu').menuPopup('close', null);

				return PopUp('popup.trigdesc.view', {
					triggerid: options.triggerid
				}, null, event.target);
			}
		}
		else {
			trigger_descr.disabled = true;
		}
		items[items.length] = trigger_descr;
	}

	// configuration
	if (typeof options.configuration !== 'undefined' && options.configuration) {
		var url = new Curl('triggers.php?form=update&triggerid=' + options.triggerid);

		items[items.length] = {
			label: t('Configuration'),
			url: url.getUrl()
		};
	}

	// url
	if (typeof options.url !== 'undefined' && options.url.length > 0) {
		items[items.length] = {
			label: t('URL'),
			url: options.url
		};
	}

	sections[sections.length] = {
		label: t('Trigger'),
		items: items
	};

	// items
	if (typeof options.items !== 'undefined' && objectSize(options.items) > 0) {
		var items = [];

		jQuery.each(options.items, function(i, item) {
			var url = new Curl('history.php');
			url.setArgument('action', item.params.action);
			url.setArgument('itemids[]', item.params.itemid);

			if (fullscreen) {
				url.setArgument('fullscreen', '1');
			}

			items[items.length] = {
				label: item.name,
				url: url.getUrl()
			};
		});

		sections[sections.length] = {
			label: t('History'),
			items: items
		};
	}

	return sections;
}

/**
 * Get menu popup trigger log section data.
 *
 * @param string options['itemid']               Item ID.
 * @param string options['itemName']             Item name.
 * @param array  options['triggers']             Triggers (optional).
 * @param string options['triggers'][n]['id']    Trigger ID.
 * @param string options['triggers'][n]['name']  Trigger name.
 * @param {object} trigger_elmnt				UI element that was clicked to open overlay dialogue.
 *
 * @return array
 */
function getMenuPopupTriggerLog(options, trigger_elmnt) {
	var items = [],
		dependent_items = getMenuPopupDependentItems(options.dependent_items);

	// create
	items[items.length] = {
		label: t('Create trigger'),
		clickCallback: function() {
			jQuery(this).closest('.action-menu').menuPopup('close', null);

			return PopUp('popup.triggerwizard', {
				itemid: options.itemid
			}, null, trigger_elmnt);
		}
	};

	var edit_trigger = {
		label: t('Edit trigger')
	};

	// edit
	if (options.triggers.length > 0) {
		var triggers = [];

		jQuery.each(options.triggers, function(i, trigger) {
			triggers[triggers.length] = {
				label: trigger.name,
				clickCallback: function() {
					jQuery(this).closest('.action-menu-top').menuPopup('close', null);

					return PopUp('popup.triggerwizard', {
						itemid: options.itemid,
						triggerid: trigger.id
					}, null, trigger_elmnt);
				}
			};
		});

		edit_trigger.items = triggers;
	}
	else {
		edit_trigger.disabled = true;
	}

	items[items.length] = edit_trigger;

	dependent_items = dependent_items.pop();
	items[items.length] = dependent_items.items.pop();

	return [{
		label: sprintf(t('Item "%1$s"'), options.itemName),
		items: items
	}];
}

/**
 * Get menu structure for dependent items.
 *
 * @param array options['item_name']  Menu label.
 * @param array options['add_label']  Add dependent item menu element label.
 * @param array options['add_url']    Add dependent item menu element url.
 *
 * @return array
 */
function getMenuPopupDependentItems(options) {
	return [{
		label: sprintf(t('Item "%1$s"'), options.item_name),
		items: [{
			label: options.add_label,
			url: options.add_url
		}]
	}];
}

/**
 * Get data for the "Insert expression" menu in the trigger expression constructor.
 *
 * @return array
 */
function getMenuPopupTriggerMacro(options) {
	var items = [],
		expressions = [
			{
				label: t('Trigger status "OK"'),
				string: '{TRIGGER.VALUE}=0'
			},
			{
				label: t('Trigger status "Problem"'),
				string: '{TRIGGER.VALUE}=1'
			}
		];

	jQuery.each(expressions, function(key, expression) {
		items[items.length] = {
			label: expression.label,
			clickCallback: function() {
				var expressionInput = jQuery('#expr_temp');

				if (expressionInput.val().length > 0 && !confirm(t('Do you wish to replace the conditional expression?'))) {
					return false;
				}

				expressionInput.val(expression.string);

				jQuery(this).closest('.action-menu').menuPopup('close', null);
			}
		};
	});

	return [{
		label: t('Insert expression'),
		items: items
	}];
}

/**
 * Build script menu tree.
 *
 * @param array scripts           Scripts names.
 * @param array hostId            Host ID.
 * @param {object} trigger_elmnt  UI element which triggered opening of overlay dialogue.
 *
 * @returns array
 */
function getMenuPopupScriptData(scripts, hostId, trigger_elmnt) {
	var tree = {};

	var appendTreeItem = function(tree, name, items, params) {
		if (items.length > 0) {
			var item = items.shift();

			if (typeof tree[item] === 'undefined') {
				tree[item] = {items: {}};
			}

			appendTreeItem(tree[item].items, name, items, params);
		}
		else {
			tree[name] = {
				params: params,
				items: {}
			};
		}
	};

	// parse scripts and create tree
	for (var key in scripts) {
		var script = scripts[key];

		if (typeof script.scriptid !== 'undefined') {
			var items = splitPath(script.name),
				name = (items.length > 0) ? items.pop() : script.name;

			appendTreeItem(tree, name, items, {
				hostId: hostId,
				scriptId: script.scriptid,
				confirmation: script.confirmation
			});
		}
	}

	// build menu items from tree
	var getMenuPopupScriptItems = function(tree, trigger_elm) {
		var items = [];

		if (objectSize(tree) > 0) {
			jQuery.each(tree, function(name, data) {
				var item = {label: name};

				if (typeof data.items !== 'undefined' && objectSize(data.items) > 0) {
					item.items = getMenuPopupScriptItems(data.items, trigger_elm);
				}

				if (typeof data.params !== 'undefined' && typeof data.params.scriptId !== 'undefined') {
					item.clickCallback = function(e) {
						jQuery(this).closest('.action-menu-top').menuPopup('close', null, false);
						executeScript(data.params.hostId, data.params.scriptId, data.params.confirmation, trigger_elm);
						cancelEvent(e);
					};
				}

				items[items.length] = item;
			});
		}

		return items;
	};

	return getMenuPopupScriptItems(tree, trigger_elmnt);
}

jQuery(function($) {

	/**
	 * Menu popup.
	 *
	 * @param array  sections              Menu sections.
	 * @param string sections[n]['label']  Section title (optional).
	 * @param array  sections[n]['items']  Section menu data (see createMenuItem() for available options).
	 * @param object event                 Menu popup call event.
	 *
	 * @see createMenuItem()
	 */
	$.fn.menuPopup = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else {
			return methods.init.apply(this, arguments);
		}
	};

	var methods = {
		init: function(sections, event) {
			var opener = $(this),
				id = opener.data('menu-popup-id'),
				menuPopup = $('#' + id),
				mapContainer = null,
				target = event.target;

			if (event.type === 'contextmenu' || (IE && opener.closest('svg').length > 0)
					|| event.originalEvent.detail !== 0) {
				target = event;
			}

			// Close other action menus.
			$('.action-menu-top').not('#' + id).menuPopup('close');

			if (menuPopup.length > 0) {
				var display = menuPopup.css('display');

				// Hide current action menu sub-levels.
				$('.action-menu', menuPopup).css('display', 'none');

				if (display === 'block') {
					menuPopup.fadeOut(0);
				}
				else {
					menuPopup.fadeIn(50);
				}

				menuPopup.position({
					of: target,
					my: 'left top',
					at: 'left bottom'
				});
			}
			else {
				id = new Date().getTime();

				menuPopup = $('<ul>', {
					'id': id,
					'role': 'menu',
					'class': 'action-menu action-menu-top',
					'tabindex': 0
				});

				// create sections
				var sections_length = sections.length;
				if (sections_length) {
					$.each(sections, function(i, section) {
						if ((typeof section.label !== 'undefined') && (section.label.length > 0)) {
							var h3 = $('<h3>').text(section.label);
							var sectionItem = $('<li>').append(h3);
						}

						// Add section delimited for all sections except first one.
						if (i > 0) {
							menuPopup.append($('<li>').append($('<div>')));
						}
						menuPopup.append(sectionItem);

						$.each(section.items, function(i, item) {
							if (sections_length > 1) {
								item['ariaLabel'] = section.label + ', ' + item['label'];
							}
							menuPopup.append(createMenuItem(item));
						});
					});
				}

				if (sections_length == 1) {
					menuPopup.attr({'aria-label': sections[0].label});
				}

				// Skip displaying empty menu sections.
				if (menuPopup.children().length == 0) {
					return;
				}

				// Set menu popup for map area.
				if (opener.prop('tagName') === 'AREA') {
					$('.menuPopupContainer').remove();

					mapContainer = $('<div>', {
						'class': 'menuPopupContainer',
						'css': {
							position: 'absolute',
							top: event.pageY,
							left: event.pageX
						}
					})
					.append(menuPopup);

					$('body').append(mapContainer);
				}
				// Set menu popup for common html elements.
				else {
					opener.data('menu-popup-id', id);

					$('body').append(menuPopup);
				}

				// Hide current action menu sub-levels.
				$('.action-menu', menuPopup).css('display', 'none');

				// display
				menuPopup
					.fadeIn(50)
					.data('is-active', false)
					.mouseenter(function() {
						menuPopup.data('is-active', true);

						clearTimeout(window.menuPopupTimeoutHandler);
					})
					.on('click', function(e) {
						e.stopPropagation();
					})
					.position({
						of: (opener.prop('tagName') === 'AREA') ? mapContainer : target,
						my: 'left top',
						at: 'left bottom'
					});
			}

			addToOverlaysStack('contextmenu', event.target, 'contextmenu');

			$(document)
				.on('click', {menu: menuPopup}, menuPopupDocumentCloseHandler)
				.on('keydown', {menu: menuPopup}, menuPopupKeyDownHandler);

			menuPopup.focus();
		},
		close: function(trigger_elmnt, return_focus) {
			var menuPopup = $(this);
			if (!menuPopup.is(trigger_elmnt) && menuPopup.has(trigger_elmnt).length === 0) {
				menuPopup.data('is-active', false);
				menuPopup.fadeOut(0);

				$('.highlighted', menuPopup).removeClass('highlighted');
				$('[aria-expanded="true"]', menuPopup).attr({'aria-expanded': 'false'});

				$(document)
					.off('click', menuPopupDocumentCloseHandler)
					.off('keydown', menuPopupKeyDownHandler);

				removeFromOverlaysStack('contextmenu', return_focus);
			}
		}
	};

	/**
	 * Expends hovered/selected context menu item.
	 */
	$.fn.actionMenuItemExpand = function() {
		var li = $(this),
			pos = li.position(),
			menu = li.closest('.action-menu');

		for (var item = $('li:first-child', menu); item.length > 0; item = item.next()) {
			if (item[0] == li[0]) {
				$('>a', li[0]).addClass('highlighted');

				if (!$('ul', item[0]).is(':visible')) {
					$('ul:first', item[0]).prev('[role="menuitem"]').attr({'aria-expanded': 'true'});

					$('ul:first', item[0])
						.css({
							'top': pos.top - 6,
							'left': pos.left + li.outerWidth() + 14,
							'display': 'block'
						});
				}
			}
			else {
				// Remove activity from item that has been selected by keyboard and now is deselected using mouse.
				if ($('>a', item[0]).hasClass('highlighted')) {
					$('>a', item[0]).removeClass('highlighted').blur();
				}

				// Closes all other submenus from this level, if they were open.
				if ($('ul', item[0]).is(':visible')) {
					$('ul', item[0]).prev('[role="menuitem"]').removeClass('highlighted');
					$('ul', item[0]).prev('[role="menuitem"]').attr({'aria-expanded': 'false'});
					$('ul', item[0]).css({'display': 'none'});
				}
			}
		}

		return this;
	};

	/**
	 * Collapses context menu item that has lost focus or is not selected anymore.
	 */
	$.fn.actionMenuItemCollapse = function() {
		// Remove style and close sub-menus in deeper levels.
		var parent_menu = $(this).closest('.action-menu');
		$('.highlighted', parent_menu).removeClass('highlighted');
		$('[aria-expanded]', parent_menu).attr({'aria-expanded': 'false'});
		$('.action-menu', parent_menu).css({'display': 'none'});

		// Close actual menu level.
		parent_menu.not('.action-menu-top').css({'display': 'none'});
		parent_menu.prev('[role="menuitem"]').attr({'aria-expanded': 'false'});

		return this;
	};

	function menuPopupDocumentCloseHandler(event) {
		$(event.data.menu[0]).menuPopup('close');
	}

	function menuPopupKeyDownHandler(event) {
		var link_selector = '.action-menu-item',
			menu_popup = $(event.data.menu[0]),
			level = menu_popup,
			selected,
			items;

		// Find active menu level.
		while ($('[aria-expanded="true"]:visible', level).length) {
			level = $('[aria-expanded="true"]:visible:first', level.get(0)).next('[role="menu"]');
		}

		// Find active menu items.
		items = $('>li', level).filter(function() {
			return $(this).has('.action-menu-item').length;
		});

		// Find an element that was selected when key was pressed.
		if ($('.action-menu-item.highlighted', level).length) {
			selected = $(link_selector + '.highlighted', level).closest('li');
		}
		else if ($('.action-menu-item', level).filter(function() {
			return this == document.activeElement;
		}).length) {
			selected = $(document.activeElement).closest('li');
		}

		// Perform action based on keydown event.
		switch (event.which) {
			case 37: // arrow left
				if (typeof selected !== 'undefined' && selected.has('.action-menu')) {
					if (level != menu_popup) {
						selected.actionMenuItemCollapse();

						// Must focus previous element, otherwise screen reader will exit menu.
						selected.closest('.action-menu').prev('[role="menuitem"]').addClass('highlighted').focus();
					}
				}
				break;

			case 38: // arrow up
				if (typeof selected === 'undefined') {
					$(link_selector + ':last', level).addClass('highlighted').focus();
				}
				else {
					var prev = items[items.index(selected) - 1];
					if (typeof prev === 'undefined') {
						prev = items[items.length - 1];
					}

					$(link_selector, selected).removeClass('highlighted');
					$(link_selector + ':first', prev).addClass('highlighted').focus();
				}

				// Prevent page scrolling.
				event.preventDefault();
				break;

			case 39: // arrow right
				if (typeof selected !== 'undefined' && selected.has('.action-menu')) {
					selected.actionMenuItemExpand();
					$('ul > li ' + link_selector + ':first', selected).addClass('highlighted').focus();
				}
				break;

			case 40: // arrow down
				if (typeof selected === 'undefined') {
					$(link_selector + ':first', items[0]).addClass('highlighted').focus();
				}
				else {
					var next = items[items.index(selected) + 1];
					if (typeof next === 'undefined') {
						next = items[0];
					}

					$(link_selector, selected).removeClass('highlighted');
					$(link_selector + ':first', next).addClass('highlighted').focus();
				}

				// Prevent page scrolling.
				event.preventDefault();
				break;

			case 27: // ESC
				$(menu_popup).menuPopup('close', null);
				break;

			case 13: // Enter
				if (typeof selected !== 'undefined') {
					$('>' + link_selector, selected)[0].click();
				}
				break;

			case 9: // Tab
				event.preventDefault();
				break;
		}

		return false;
	}

	/**
	 * Create menu item.
	 *
	 * @param string options['label']          Link label.
	 * @param string options['ariaLabel']	   Aria-label text.
	 * @param string options['url']            Link url.
	 * @param string options['css']            Item class.
	 * @param array  options['data']           Item data ("key" => "value").
	 * @param array  options['items']          Item sub menu.
	 * @param object options['clickCallback']  Item click callback.
	 *
	 * @return object
	 */
	function createMenuItem(options) {
		options = $.extend({
			ariaLabel: options.label,
			selected: false,
			disabled: false
		}, options);

		var item = $('<li>'),
			link = $('<a>', {
				role: 'menuitem',
				tabindex: '-1',
				'aria-label': options.selected ? sprintf(t('%1$s, selected'), options.ariaLabel) : options.ariaLabel
			}).data('aria-label', options.ariaLabel);

		if (typeof options.label !== 'undefined') {
			link.text(options.label);

			if (typeof options.items !== 'undefined' && options.items.length > 0) {
				// if submenu exists
				link.append($('<span>', {'class': 'arrow-right'}));
			}
		}

		if (typeof options.data !== 'undefined' && objectSize(options.data) > 0) {
			$.each(options.data, function(key, value) {
				link.data(key, value);
			});
		}

		if (options.disabled) {
			link.addClass('action-menu-item-disabled');
		}
		else {
			link.addClass('action-menu-item');

			if (typeof options.url !== 'undefined') {
				link.attr('href', options.url);
			}

			if (typeof options.clickCallback !== 'undefined') {
				link.on('click', options.clickCallback);
			}
		}

		if (options.selected) {
			link.addClass('selected');
		}

		if (typeof options.items !== 'undefined' && options.items.length > 0) {
			link.attr({
				'aria-haspopup': 'true',
				'aria-expanded': 'false',
				'area-hidden': 'true'
			});
		}

		item.append(link);

		if (typeof options.items !== 'undefined' && options.items.length > 0) {
			var menu = $('<ul>', {
					class : 'action-menu',
					role: 'menu'
				})
				.on('mouseenter', function(e) {
					// Prevent 'mouseenter' event in parent item, that would call actionMenuItemExpand() for parent.
					e.stopPropagation();
				});

			$.each(options.items, function(i, item) {
				menu.append(createMenuItem(item));
			});

			item.append(menu);
		}

		item.on('mouseenter', function(e) {
			e.stopPropagation();
			$(this).actionMenuItemExpand();
		});

		return item;
	}
});
