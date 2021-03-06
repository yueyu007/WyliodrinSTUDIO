
"use strict";

var angular = require ('angular');

var _ = require ('lodash');

var settings = require ('settings');
require ('debug').enable (settings.debug);
var debug = require ('debug')('wyliodrin:lacy:line');
var Highcharts = require ('highcharts/highstock');
require ('highcharts/highcharts-more')(Highcharts);
require ('highcharts/modules/solid-gauge')(Highcharts);
require ('highcharts/modules/exporting')(Highcharts);
require ('highcharts/modules/offline-exporting')(Highcharts);

debug ('Loading');

module.exports = function ()
{
	var app = angular.module ('wyliodrinApp');
	app.directive ('line', function ($wydevice, $timeout, $wyapp, $mdDialog){
		debug ('Registering');
		return {
			restrict: 'E',
			scope:{
				signal: '='
			},
			template: '<highchart config="setup" style="width:100%;"></highchart>',
			controller: function ($scope)
			{
				$scope.buffer = [];
				$scope.setup = {
					options:
					{
						chart:
						{
							type: ($scope.signal.properties.style!=='step'?$scope.signal.properties.style:'line'),
							animation: false,
						},
						yAxis:
					    {
					    	min: ($scope.signal.properties.fixedAxis)?$scope.signal.properties.minAxisValue:undefined,
					    	max: ($scope.signal.properties.fixedAxis)?$scope.signal.properties.maxAxisValue:undefined,
					    	type: ($scope.signal.properties.logarithmic)?'logarithmic':undefined,
					    	title: $scope.signal.properties.axisName
					    },
					    exporting:
						{
							buttons:
							{
								contextButton: {
									menuItems: Highcharts.getOptions().exporting.buttons.contextButton.menuItems.concat (
										{
											text: 'Export Value',
										    onclick: function () {
										        downloadValue (this);
										    }
										})
								}
							}
						},
					    navigator:
					    {
					    	enabled: $scope.signal.properties.showOverview,
					    },

					    scrollbar:
					    {
					    	enabled: $scope.signal.properties.showScrollbar,
					    },
					    rangeSelector:
					    {
					    	enabled: false,
					    },
					    plotOptions: {
					    	series:
						    {
						    	step: $scope.signal.properties.style === 'step',
						    	marker: {
						    		enabled: $scope.signal.properties.showPoints
						    	}
						    },
					    },
						legend:
						{
							enabled: $scope.signal.properties.hideLegend === false,
							align: 'right',
				        	// backgroundColor: '#FCFFC5',
				        	// borderColor: 'black',
				        	// borderWidth: 2,
					    	layout: 'vertical',
					    	verticalAlign: 'top',
					    	y: 100,
					    	shadow: false
						},
						credits:
						{
							enabled: false
						}
					},
					size: 
					{
						// width: 400,
						height: 300
					},
					title:
					{
						text: $scope.signal.properties.title
					},
					useHighStocks: true,
					series: [{
						name: $scope.signal.title,
						color: $scope.signal.color,
						data: []
					}],
					loading: false,
					func: function (chart)
					{
						$timeout(function() 
						{
							chart.reflow();
						}, 0);
					}
				};

				$scope.$watchCollection ('signal.properties', function ()
				{
					debug ('Signal setup');
					$wyapp.emit ('dashboard');
					// console.log ('signal');
					// console.log ($scope.signal);
					// console.log ($scope.signal.properties);
					// $scope.setup.options.chart.type = $scope.signal.type;
					// $scope.setup.series =
					// [{
					// 	title: $scope.signal.title,
					// 	color: $scope.signal.color,
					// 	data: []
					// }];

					// $scope.setup.title.text = $scope.signal.title;

					$scope.setup.options.chart.type = ($scope.signal.properties.style!=='step'?$scope.signal.properties.style:'line');
					$scope.setup.options.yAxis.min = ($scope.signal.properties.fixedAxis)?$scope.signal.properties.minAxisValue:undefined;
					$scope.setup.options.yAxis.max = ($scope.signal.properties.fixedAxis)?$scope.signal.properties.maxAxisValue:undefined;
					$scope.setup.options.yAxis.type = ($scope.signal.properties.logarithmic)?'logarithmic':undefined;
					$scope.setup.options.yAxis.title = $scope.signal.properties.axisName;
					$scope.setup.options.plotOptions.series.step = $scope.signal.properties.style === 'step';
					$scope.setup.options.navigator.enabled = $scope.signal.properties.showOverview;
					$scope.setup.options.scrollbar.enabled = $scope.signal.properties.showScrollbar;
					$scope.setup.options.legend.enabled = $scope.signal.properties.hideLegend === false;
					$scope.setup.options.plotOptions.series.marker.enabled = $scope.signal.properties.showPoints;
					$scope.setup.title.text = $scope.signal.properties.title;
				});

				$scope.$watchCollection ('signal', function (vnew, vold)
				{
					debug ('Signal');
					$wyapp.emit ('dashboard');
					$scope.setup.series[0].name = $scope.signal.title;
					$scope.setup.series[0].color = $scope.signal.color;
				});


				function downloadValue (chart)
				{
					var value = {};
					for (var seriesindex in chart.series)
					{
						var series = chart.series[seriesindex];
						if (series.name.indexOf('debug_')!==0)
						{
							value[series.name] = [[],[]];
							for (var pvalueindex in chart.series[seriesindex].points)
							{
								var pvalue = chart.series[seriesindex].points[pvalueindex];
								value[series.name][0].push (pvalue.x);
								value[series.name][1].push (pvalue.y);
							}
						}
					}
					// console.log (value);
					var values_export = $mdDialog.show({
						        controller: function ($scope)
						        {
						        	$scope.value = JSON.stringify (value, null, 2);
						        	this.exit = function ()
						        	{
						        		$mdDialog.hide ();
						        	};
						        },
						        controllerAs: 'v',
								templateUrl: '/public/views/values-export.html',
								// parent: angular.element(window.body),
								// targetEvent: ev,
								clickOutsideToClose:true,
								fullscreen: false
						});
					// bootbox.dialog({
				 //            title: "Export Value",
				 //            message: 'Value<textarea id="value" style="width:100%" rows="5"></textarea>',
				 //        }
				 //    );
				    // $('#value').val (stringify (value));
					// console.log (value);
				}
			},
			conrollerAs: 'l',
			link: function (scope, element, attrs)
			{
				var updateData = function ()
				{
					if (scope.buffer.length > 0)
					{
						_.each (scope.buffer, function (s)
						{
							// console.log (s);
							scope.setup.series[0].data.push (s);
						});
						if (scope.signal.properties.maxPoints <= scope.setup.series[0].data.length)
						{
							// console.log (scope.setup.series[0].data.length+' '+scope.signal.properties.maxPoints+' ');
							scope.setup.series[0].data.splice (0, scope.setup.series[0].data.length-scope.signal.properties.maxPoints);
						}
						scope.buffer.splice (0, scope.buffer.length);
						$timeout (function ()
						{
						});
					}
				};

				var dataupdater = setInterval (updateData, 1000);

				var update = function (t, values)
				{
					// console.log (scope.signal.title);
					if (t === 'v')
					{
						var v = (values.s?values.s[scope.signal.title]:undefined);
						// console.log (v);
						if (v !== undefined)
						{
							scope.buffer.push ([values.t, v]);
							debug ('Signal '+scope.signal.title+' '+v);
							if (!scope.signal.values) 
							{
								$timeout (function ()
								{
									scope.signal.values = true;
								});
							}
							// console.log (values.t+', '+v);
							// console.log (scope.setup.series);
						}
					}
				};

				$wydevice.on ('message', update);

				element.on ('$destroy', function ()
				{
					debug ('Erase line');
					$wydevice.removeListener ('message', update);
					clearInterval (dataupdater);
				});
			}
		};
	});
};
