var usuario_logeado = null;
var jsonConfig = null;
var shipsData = null;
var tableData = null;
var currentShip = null;
var ComparingShips = [];

//Esto se usa para leer archivos desde JQuery:
var files;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var fs = null;

Iniciar();
function Iniciar() {
    try {
        //Load data from a JSON file:
        ShowLoading('Loading..');
        //console.log('loading..');
        $.getJSON('data/sc_ships_ccu.json', function (data) {
            shipsData = data; // console.log(shipsData);
            SetShipsDataTable_DT(shipsData);
            CargarComboDatos(shipsData.data, '#agilCboShips');
            HideLoading();
        });
    } catch (e) {
        $.alert({ title: e.name, content: e.message, useBootstrap: false });
    }

    // Obtiene los Valores Iniciales del Tamaño de la Ventana
    var winWidth = $(window).width();
    var winHeight = $(window).height() - 50;

    // make sure div stays full width/height on resize
    $(window).resize(function () { $('#pdfViewer').css({ 'width': winWidth, 'height': winHeight }); });

    /******** AQUI SE ENLAZAN LOS EVENTOS DE LOS CONTROLES ***********/
    $(document).on("click", "#cmdAddToCCUFrom", function (evt) {
        console.log(2);
        $('#listShipCCU').val('');
        $('input[data-type="search"]').trigger("keyup");
    });

    $(document).on("click", "#cmdSaveData", function (evt) {
        /* GUARDA LOS DATOS EN UN ARCHIVO JSON */
        downloadObjectAsJson(shipsData, "sc_ships_ccu");
    });

    $(document).on("click", "#pVG2cB_cmdSwap", function (evt) {
        /* INTERCAMBIA LAS NAVES QUE SE ESTAN COMPARANDO */
        if (ComparingShips != undefined && ComparingShips.length > 0) {
            Comare2Ships(ComparingShips[1], ComparingShips[0]); //<- Shows a Vertical Comparation
        }
    });

    //Al cambiar de pagina
    //console.log('Al cambiar de pagina..2');
    $(document).on("pagecontainertransition", function (event, ui) {
        if (ui.toPage.prop("id") == "pageTable") {
            CargarListaDatosManufac(shipsData.data, '#listShips');
            CargarListaDatos(shipsData.data, '#listShipCCU');
            CargarComboDatos(shipsData.Manufacturers, '#cboManufacturers');
            CargarComboDatos(shipsData.Types, '#cboShipTypes');
            CargarComboDatos(shipsData.Careers, '#cboCarreers');

            // Enable or Disable Controls:
            $('#cboManufacturers').attr("disabled", "disabled");
            $('#cboShipTypes').attr("disabled", "disabled");
            $('#cboCarreers').attr("disabled", "disabled");

            $('#txtShipName').attr("disabled", "disabled");
            $('#txtShipRole').attr("disabled", "disabled");
            $('#numGamePrice').attr("disabled", "disabled");
            $('#numPledgePrice').attr("disabled", "disabled");
        }
    });


    //- Evento al seleccionar un elemento del ListView:
    $(document).on("click", "#listShips li", function (evt) {
        /* MUESTRA LOS DETALLES DE LA NAVE SELECCIONADA  */

        var SelectedShip = $(this).data("datos"); //<- Obtiene los datos del elemento seleccionado
        //Buscamos la nave actual en la lista de naves:
        var found = shipsData.data.find((element) => element.ID == SelectedShip.ID);
        CargarNaveSeleccionada(found);
    });
    $(document).on("click", "#listShipCCU li", function (evt) {
        /* AGREGA UNA NUEVA NAVE A LA LISTA DESDE DONDE SE PUEDE HACER CCU */
        var SelectedShip = $(this).data("datos"); //<- Obtiene los datos del elemento seleccionado
        if (currentShip != null && SelectedShip != null) {
            //console.log(SelectedShip); //<- Esta es la Nave que queremos agregar
            //console.log(currentShip);  //<- Esta es la Nave Actualmente Cargada

            //Buscamos la nave actual en la lista de naves:
            var found = shipsData.data.find((element) => element.ID == currentShip.ID);
            if (found != null) {
                //Revisamos si la nave que queremos agregar ya existe en la lista:
                const existe = found.CCUFromID.indexOf(SelectedShip.ID);
                if (existe >= 0) {
                    showMessage('Unable to Comply!', 'This ship is already on the List.');
                }
                else {
                    // La Nave No Existe, la podemos agregar
                    shipsData.data.find((element) => element.ID == currentShip.ID).CCUFromID.push(SelectedShip.ID);

                    //Creamos un control para mostrar la nave agregada
                    var opt = $('<li>' + SelectedShip.Name + '</li>');
                    opt.attr("data-datos", JSON.stringify(SelectedShip));
                    $('#listCCUFrom').append(opt).listview("refresh");
                }
                shipsData.data.find((element) => element.ID == currentShip.ID).CCUFromID.sort();
            }

            //Clears the Search filter:
            $("#divShipsForCCU").find("input").val("").focus().trigger("change");
            $('#listShipCCU').focus();
        }
    });
    $(document).on("click", "#listCCUFrom li", function (evt) {
        /* MUESTRA EL COSTO DE LA ACTUALIZACION (Desde la Nave Seleccionada hacia la Nave Actual) */
        if (currentShip != null) {
            var SelectedShip = $(this).data("datos"); //<- Obtiene los datos del elemento seleccionado
            $('#rowShipFrom').html(SelectedShip.Name);
            $('#rowPriceFrom').html('$' + SelectedShip.PledgeUSD);

            $('#rowCenter').html('&#x2192;');

            $('#rowShipTo').html(currentShip.Name);
            $('#rowPriceTo').html('$' + currentShip.PledgeUSD);

            var priceDiff = currentShip.PledgeUSD - SelectedShip.PledgeUSD;
            $('#rowPriceDiff').html('+$' + priceDiff);
        }
    });
    $(document).on("click", "#listCCUTo li", function (evt) {
        /* MUESTRA EL COSTO DE LA ACTUALIZACION (Desde la Nave Actual hacia la Nave Seleccionada) */
        if (currentShip != null) {
            var SelectedShip = $(this).data("datos"); //<- Obtiene los datos del elemento seleccionado
            $('#rowShipFrom').html(currentShip.Name);
            $('#rowPriceFrom').html('$' + currentShip.PledgeUSD);

            $('#rowCenter').html('&#x2192;');

            $('#rowShipTo').html(SelectedShip.Name);
            $('#rowPriceTo').html('$' + SelectedShip.PledgeUSD);

            var priceDiff = SelectedShip.PledgeUSD - currentShip.PledgeUSD;
            $('#rowPriceDiff').html('+$' + priceDiff);
        }
    });
    $(document).on("click", "#listMeltingTo li", function (evt) {
        /* MUESTRA EL COSTO DE LA ACTUALIZACION (Desde la Nave Actual hacia la Nave Seleccionada) */
        if (currentShip != null) {
            var SelectedShip = $(this).data("datos"); //<- Obtiene los datos del elemento seleccionado
            $('#rowShipFrom').html(currentShip.Name);
            $('#rowPriceFrom').html('$' + currentShip.PledgeUSD);

            $('#rowCenter').html(SelectedShip.Name);
            $('#rowPriceDiff').html('$' + SelectedShip.PledgeUSD);

            $('#rowShipTo').html('Change'); var priceDiff = currentShip.PledgeUSD - SelectedShip.PledgeUSD;
            $('#rowPriceTo').html('+$' + priceDiff);
        }
    });

    $('#cboManufacturers').on('change', function () {
        var mValorSelect = $(this).val(); console.log(mValorSelect); //<- Valor Seleccionado

        var mSeleccionado = $('#cboManufacturers option:selected');
        console.log(mSeleccionado.text());
        console.log(mSeleccionado.data("datos")); //<- Obtiene los datos del elemento seleccionado
    });
    $('#agilCboShips').on('change', function () {
        /* Compara la Agilidad de 2 Naves */
        var mSeleccionado = $('#agilCboShips option:selected');
        const data = mSeleccionado.data("datos"); //<- Obtiene los datos del elemento seleccionado
        if (data != undefined) {
            const agilData_B = GetAgility(data.Agility_PYR); //console.log(agilData_B);

            $('#agilTxtP_2').val('Pitch: ' + agilData_B.pitch);
            $('#agilTxtY_2').val('Yaw:   ' + agilData_B.yaw);
            $('#agilTxtR_2').val('Roll:  ' + agilData_B.roll);

            var ShipData = $('#agilTxtShipName').attr("data-ship");   //<- Datos asociados al Control
            const agilData_A = GetAgility(ShipData); //console.log(agilData_A);            

            const agilityComparison = calculateAgilityPercentage(agilData_A, agilData_B);
            $('#lblCompareAgility').html(agilityComparison);
        }
    });

    /* COMBOS DE FILTRO EN LA PAGINA 2  */
    $('#p2-cboManufacturer').on('change', function () {
        var mValorSelect = $(this).val(); console.log(mValorSelect); //<- Valor Seleccionado
        if (mValorSelect != null && mValorSelect.length > 0) {
            console.log('Hay ' + mValorSelect.length + ' Seleccionados!');

        }
    });
    $('#p2-cboType').on('change', function () {
        var mValorSelect = $(this).val(); console.log(mValorSelect); //<- Valor Seleccionado
        var mSeleccionado = $('#p2-cboType option:selected');

        console.log(mSeleccionado.text());
        console.log(mSeleccionado.data("datos")); //<- Obtiene los datos del elemento seleccionado
    });
    $('#p2-cboShipCareer').on('change', function () {
        var mValorSelect = $(this).val(); console.log(mValorSelect); //<- Valor Seleccionado
        var mSeleccionado = $('#p2-cboShipCareer option:selected');

        console.log(mSeleccionado.text());
        console.log(mSeleccionado.data("datos")); //<- Obtiene los datos del elemento seleccionado
    });
}



/******* AQUI VAN OTRAS FUNCIONES COMPLEMENTARIAS ***************/

/** Carga los datos en un ListView:
 * @param {Array} pDatos - Array de Datos a Cargar.
 * @param {object} pListView - Referencia a la Lista donde se muestran los datos.
 * @param {boolean} pLinked - 'false' si los elementos de la lista no responden a los clicks.
 */
function CargarListaDatos(pDatos, pListView, pLinked = true, pPledged = false) {
    try {
        $(pListView).empty(); //<- Borra todos los elementos presentes en el ListView
        if (pDatos != null && pDatos.length > 0) {
            //Por cada dato en el conjunto de datos:
            pDatos.forEach(function (Dato) {
                //console.log(Reporte);
                //El dato particular se almacena en el atributo 'data-datos' de cada elelmento de la lista
                if (pLinked === true) {
                    var pledgePrice = "";
                    if (pPledged === true) {
                        pledgePrice = ' ($' + Dato.PledgeUSD + ')';
                    }
                    var opt = $('<li><a href="#">' + Dato.Name + pledgePrice + '</a></li>');
                    opt.attr("data-datos", JSON.stringify(Dato));

                    $(pListView).append(opt);
                } else {
                    var opt = $('<li>' + Dato.Name + ' ($' + Dato.PledgeUSD + ')</li>');
                    opt.attr("data-datos", JSON.stringify(Dato));

                    $(pListView).append(opt);
                }
            });

            $(pListView).listview("refresh");
        }
    } catch (e) {
        console.log(e);
    }
}

/** Carga los datos en un ListView con Agrupadores x Fabricante
 * @param {Array} pDatos - Array de Datos a Cargar.
 * @param {object} pListView - Referencia a la Lista donde se muestran los datos.
 */
function CargarListaDatosManufac(pDatos, pListView) {
    try {
        if (pDatos != null) {

            var HTML = ""; //<- Contendral el HTML de los elementos por agregar 

            $(pListView).empty(); //<- Borra todos los elementos presentes en el ListView

            //Por cada dato en el conjunto de datos:
            var Manufacturer = "";
            pDatos.forEach(function (Dato) {
                //console.log(Reporte);

                const Builder = shipsData.Manufacturers.find((element) => element.ID == Dato.Manufacturer);
                if (Manufacturer != Builder.Name) {
                    Manufacturer = Builder.Name;
                    HTML += '<li data-role="list-divider">' + Manufacturer + '</li>';
                }

                //El dato particular se almacena en el atributo 'data-datos' de cada elelmento de la lista
                HTML += "<li data-datos='" + JSON.stringify(Dato) + "'><a href='#'>" + Dato.Name + "</a></li>";
            });

            $(pListView).append(HTML).listview("refresh"); //<- Agrega los nuevos elementos y actualiza el control
        }
    } catch (e) {
        alert(e.stack);
    }
}

/** Carga datos en un Combo:
 * @param {Array} pDatos - Array de Datos a Cargar.
 * @param {object} pComboSelect - Referencia al Combo Select donde se muestran los datos.
 */
function CargarComboDatos(pDatos, pComboSelect, pEmpty = true, pChecked = false) {
    try {
        if (pDatos != null) {
            if (pEmpty === true) { $(pComboSelect).empty(); }

            $(pComboSelect).append('<option></option>'); //<- Primera Opcion del Menu Vacia

            pDatos.forEach(function (Dato) {
                //El dato particular se almacena en el atributo 'data-datos' de cada elelmento de la lista
                var opt = $("<option>" + Dato.Name + "</option>").attr("value", Dato.ID);
                opt.attr("data-datos", JSON.stringify(Dato));
                //opt.attr("selected", "selected");
                $(pComboSelect).append(opt);
            });

            $(pComboSelect).selectmenu().selectmenu('refresh', true);
        }
    } catch (e) {
        console.log(e);
    }
}

/** CARGA Y MUESTRA LOS DATOS DE LA NAVE SELECCIONADA:
 * @param {Array} pDatos - Array de Datos a Cargar.
 */
function CargarNaveSeleccionada(pDatos) {
    try {
        if (pDatos != null) {
            currentShip = pDatos; //<- Guarda la nave cargada para posterior uso

            //- Detalles de la Nave:
            $('#txtShipName').val(pDatos.Name);
            $('#cboManufacturers').val(pDatos.Manufacturer).selectmenu('refresh');
            $('#cboShipTypes').val(pDatos.Type).selectmenu('refresh');
            $('#cboCarreers').val(pDatos.Career).selectmenu('refresh');
            $('#txtShipRole').val(pDatos.Role);
            $('#numGamePrice').val(pDatos.aUEC);
            $('#numPledgePrice').val(pDatos.PledgeUSD);

            $('#rowShipFrom').html('');
            $('#rowPriceFrom').html('');
            $('#rowShipTo').html('');
            $('#rowPriceTo').html('');
            $('#rowPriceDiff').html('');

            //if we have Ships for the CCU:
            CargarListaDatos(GetUpgradesToShip(pDatos.ID), '#listCCUTo', true, true);
            CargarListaDatos(GetUpgradesFromShip(pDatos.CCUFromID), '#listCCUFrom', true, true);
            CargarListaDatos(GetDowngradeShips(pDatos.ID), '#listMeltingTo', true, true);
        }
    } catch (e) {
        console.log(e);
    }
}

/** Obtiene la lista de naves Desde las que se puede Actualizar hacia la nave indicada:
 * @param {integer[]} ShipCCUFromIDs - Array de Integers con los IDs de las Naves.
 */
function GetUpgradesFromShip(ShipCCUFromIDs) {
    var _ret = [];
    try {
        if (ShipCCUFromIDs != null && ShipCCUFromIDs.length > 0) { //<- Si hay datos
            if (shipsData != null && shipsData.data.length > 0) { //<- Si hay naves Caregadas
                ShipCCUFromIDs.forEach(function (ShipID) {
                    try {
                        const found = shipsData.data.find((element) => element.ID == ShipID);
                        if (found != null) {
                            _ret.push(found);
                        }
                        else {
                            console.log('NOT found: ' + ShipID);
                        }
                    } catch (error) { }
                });
                //Ordena x Precio:
                if (_ret.length > 0) {
                    _ret.sort((a, b) => a.PledgeUSD - b.PledgeUSD);
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
    return _ret;
}

/** Obtiene la lista de naves Hacia las que se puede Actualizar Desde la nave indicada :
 * @param {integer} ShipID - ID de la Nave a la que se quiere actualizar.
 */
function GetUpgradesToShip(ShipID) {
    var _ret = [];
    try {
        if (shipsData != null && shipsData.data.length > 0) {
            shipsData.data.forEach(function (Ship) {
                if (Ship.CCUFromID != undefined) {
                    Ship.CCUFromID.forEach(function (shipIndexFrom) {
                        try {
                            if (shipIndexFrom === ShipID) { _ret.push(Ship); }
                        } catch (error) {
                            console.log(error);
                        }
                    });
                }
            });
            //Ordena x Precio:
            if (_ret.length > 0) {
                _ret.sort((a, b) => a.PledgeUSD - b.PledgeUSD);
            }
        }
    } catch (e) {
        console.log(e);
    }
    return _ret;
}
/** Obtiene todas las naves más baratas que la indicada. 
 * @param {int} ShipID - ID de la Nave a la que se quiere actualizar.
 * @returns {object[]} Array de Naves encontradas
 */
function GetDowngradeShips(ShipID) {
    var _ret = [];
    try {
        if (shipsData != null && shipsData.data.length > 0) {
            const found = shipsData.data.find((element) => element.ID == ShipID);
            if (found != undefined) {
                shipsData.data.forEach(function (Ship) {
                    if (Ship.PledgeUSD <= found.PledgeUSD) {
                        _ret.push(Ship);
                    }
                });
            }
            //console.log(_ret);

            //Ordena x Precio:
            if (_ret.length > 0) {
                _ret.sort((a, b) => b.PledgeUSD - a.PledgeUSD);
            }
        }
    } catch (e) {
        console.log(e);
    }
    return _ret;
}

function SetShipsDataTable(shipsDataRaw) {
    // console.log(shipsDataRaw);
    $('#shipTableBody').empty();
    if (shipsDataRaw != null && shipsDataRaw.length > 0) {
        tableData = shipsDataRaw;
        shipsDataRaw.forEach(function (DataRow) {
            try {
                var _rowHTML = '<tr>'; //<- Inicio una nueva Fila 

                // Fields:
                // Name,Manufacturer,Type,Career,Role,Pledge Value,inGame Value,Buy Location,Vehicle Size,Weapons,Turrets,MissileRacks,
                // QT Drive,Power Plant,Shields,Shield Type,HP,Crew Max,Cargo Grid,Inventory,Scm Speed,Agility (PYR),Hidrogen,QT Fuel,Weapons Capacitor,Cap Refill,

                // ---------------------
                // Colorear en rojo si la nave no es FlyReady o en Verde si esta en venta sin paquete
                if (DataRow.FlyReady === 0) {
                    _rowHTML += '<td style="color:#ff3300">' + DataRow.Name + '</td>';
                } else {
                    if (DataRow.StandAlone === 1) {
                        _rowHTML += '<td style="color:#66ff66">' + DataRow.Name + '</td>';
                    }
                    else {
                        _rowHTML += '<td>' + DataRow.Name + '</td>';
                    }
                }
                // ---------------------
                var found = shipsData.Manufacturers.find((element) => element.ID == DataRow.Manufacturer);
                if (found != null) {
                    _rowHTML += '<td>' + found.Name + '</td>';
                }
                else { _rowHTML += '<td></td>' }
                // ---------------------
                found = shipsData.Types.find((element) => element.ID == DataRow.Type);
                if (found != null) {
                    _rowHTML += '<td>' + found.Name + '</td>';
                }
                else { _rowHTML += '<td></td>' }
                // ---------------------
                found = shipsData.Careers.find((element) => element.ID == DataRow.Career);
                if (found != null) {
                    _rowHTML += '<td>' + found.Name + '</td>';
                }
                else { _rowHTML += '<td></td>' }
                // ---------------------
                _rowHTML += '<td>' + DataRow.Role + '</td>';

                if (DataRow.PledgeUSD > 0) {
                    _rowHTML += '<td>$' + formatNumber(DataRow.PledgeUSD, 0) + ' USD</td>';
                } else {
                    _rowHTML += '<td style="color:#ff3300">unknown</td>';
                }
                if (DataRow.aUEC > 0) {
                    _rowHTML += '<td>$' + formatNumber(DataRow.aUEC, 0) + ' aUEC</td>';
                } else {
                    _rowHTML += '<td style="color:#ff3300">Not for sale</td>';
                }
                // ---------------------
                _rowHTML += '<td>' + DataRow.BuyLocation + '</td>';
                _rowHTML += '<td>' + DataRow.VehicleSize + '</td>';
                _rowHTML += '<td>' + DataRow.Weapons + '</td>';
                _rowHTML += '<td>' + DataRow.Turrets + '</td>';
                _rowHTML += '<td>' + DataRow.MissileRacks + '</td>';

                _rowHTML += '<td>' + DataRow.QTDrive + '</td>';
                _rowHTML += '<td>' + DataRow.PowPlant + '</td>';
                _rowHTML += '<td>' + DataRow.Shields + '</td>';
                _rowHTML += '<td>' + DataRow.ShieldType + '</td>';

                _rowHTML += '<td>' + formatNumber(DataRow.HP, 0) + '</td>';
                _rowHTML += '<td>' + DataRow.Crew + '</td>';
                _rowHTML += '<td>' + DataRow.CargoGrid + ' scu</td>';
                _rowHTML += '<td>' + DataRow.Inventory + ' scu</td>';
                _rowHTML += '<td>' + DataRow.ScmSpeed + ' m/s</td>';
                _rowHTML += '<td>' + DataRow.Agility_PYR + '</td>';
                _rowHTML += '<td>' + formatNumber(DataRow.Fuel_H, 0) + '</td>';
                _rowHTML += '<td>' + formatNumber(DataRow.Fuel_QT, 0) + '</td>';
                _rowHTML += '<td>' + formatNumber(DataRow.Capacitor, 0) + '</td>';
                _rowHTML += '<td>' + formatNumber(DataRow.CapRefill, 0) + '</td>';

                _rowHTML += '</tr>'; //<- Fin de la Fila
                $('#shipTableBody').append(_rowHTML); //Agrega la fila a la tabla

            } catch (error) { }
        });
    }
    $('#shipTable').table(); //<- Refresca la tabla y Muestra las barras de scroll
    //$('#shipTable').empty().append(htmTable).enhanceWithin();
    $('#DivScrollTable').mCustomScrollbar({
        axis: "yx",
        theme: "dark",
        alwaysShowScrollbar: 2,
        //setLeft: "1000px"
    });
}
function SetShipsDataTable_DT(shipsDataRaw) {
    try {
        /* CARGA LOS DATOS EN UN DATATABLE: https://datatables.net */

        if (shipsDataRaw != null && shipsDataRaw.data.length > 0) {

            const table = new DataTable('#TableOfShips', {
                select: true,
                scrollX: true,
                scrollY: '64vh',
                colReorder: true,
                className: 'nowrap',
                data: shipsDataRaw.data,
                scrollCollapse: true,
                fixedColumns: {
                    start: 2
                },
                order: [[2, 'asc'], [1, 'asc']],
                orderMulti: true,
                paging: false,
                layout: {
                    top1: {
                        searchPanes: {
                            columns: [2, 3, 5, 6, 7],
                            initCollapsed: true,
                            controls: true
                        }
                    },
                    topStart: {
                        search: {
                            placeholder: 'Search here'
                        }
                    },
                    topEnd: {
                        buttons: [
                            {
                                text: 'Compare Selected',
                                action: function (e, dt, node, config, cb) {

                                    //Compara las filas seleccionadas
                                    var SelectedRows = table.rows('.selected').data();
                                    if (SelectedRows != null && SelectedRows.length > 0) {
                                        var Filter = ''; // Prepare a Filter Text for the Selected Rows's Index (ID):
                                        for (let index = 0; index < SelectedRows.length; index++) {
                                            Filter += '\\b' + SelectedRows[index].ID + '\\b|';
                                        }
                                        Filter = Filter.slice(0, -1);  //<- Cleans the tail                                      
                                        table.column(0).search(Filter, true, true).draw(); //<- Applies the Filter

                                        try {
                                            Comare2Ships(SelectedRows[0], SelectedRows[1]); //<- Shows a Vertical Comparation
                                        } catch (error) {
                                            console.log(error);
                                        }
                                    }
                                }
                            },
                            {
                                text: "Clear",
                                action: function (e, dt, node, config, cb) {
                                    table.column(0).search('', true, true).draw();
                                }
                            }
                        ]
                    }
                },

                columns: [
                    {   //index: 0
                        data: 'ID',
                        title: "Preview",
                        //searchable: false,
                        render: function (data, type, row, meta) {
                            if (type === 'display') {
                                // Agrega 2 Botones: un link a la pagina del Store y una Imagen preview         
                                var storeLink = row.StorePage;
                                //const rowData = JSON.stringify(row);   console.log(rowData);       

                                let controls = `<a href="#" data-ltype="linkShipPageF" data-shipid="${storeLink}" class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-info ui-btn-icon-notext">RSI Page</a>`;
                                controls += `<a href="#" data-ltype="popImgPreview" data-shipid="${data}"      class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-camera ui-btn-icon-notext">Preview</a>`;
                                controls += `<a href="#" data-ltype="popVerticalData" data-shipid="${data}"    class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-bullets ui-btn-icon-notext">Details</a>`;
                                return controls;
                            }
                            return data;
                        }
                    },
                    {   //index: 1
                        data: 'Name', title: 'Name',
                        render: function (ShipID, type, row, meta) {
                            if (type === 'display') {
                                // Colorear en rojo si la nave no es FlyReady o en Verde si esta en venta sin paquete
                                let color = 'white';
                                if (row.FlyReady === 0) { color = '#FE1800'; }
                                else {
                                    if (row.StandAlone === 1) { color = '#04FC22'; }
                                }
                                return `<span style="color:${color}">${ShipID}  </span>`;
                            }
                            return ShipID;
                        }
                    },
                    {   //index: 2
                        data: 'Manufacturer',
                        title: 'Manufacturer',
                        className: 'dt-body-center dt-head-center',
                        //className: 'text-left', width: '300px',
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Manufacturers.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return ShipID;
                        }
                    },
                    {   //index: 3
                        data: 'FlyReady', title: 'FlyReady', searchable: false,
                        className: 'dt-body-center dt-head-center',
                        render: function (data, type) {
                            let checked = '';
                            if (type === 'display') {
                                if (data === 1) {
                                    checked = 'checked=""';
                                }
                                return `<input type="checkbox" ${checked}>`;
                            }
                            return data;
                        }
                    },
                    {   //index: 4
                        data: 'StandAlone', title: 'StandAlone', searchable: false,
                        className: 'dt-body-center dt-head-center',
                        render: function (data, type) {
                            let checked = '';
                            if (type === 'display') {
                                if (data === 1) {
                                    checked = 'checked=""';
                                }
                                return '<input type="checkbox" ' + checked + '>';
                            }
                            return data;
                        }
                    },
                    {   //index: 5
                        data: 'Type', title: 'Type',
                        className: 'dt-body-center dt-head-center',
                        render: function (ShipID, type) {
                            const found = shipsData.Types.find((element) => element.ID == ShipID);
                            if (type === 'display') {
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            else if (type === 'filter') {
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return ShipID;
                        }
                    },
                    {   //index: 6
                        data: 'Career', title: 'Career',
                        className: 'dt-body-center dt-head-center',
                        render: function (ShipID, type) {
                            const found = shipsData.Careers.find((element) => element.ID == ShipID);
                            if (type === 'display') {
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            else if (type === 'filter') {
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return ShipID;
                        }
                    },
                    { data: 'Role', title: 'Role', className: 'dt-body-center dt-head-center' },  //index: 7
                    { data: 'PledgeUSD', title: 'Pledge USD', searchable: false, render: DataTable.render.number(',', '.', 0, '$'), className: 'dt-body-center dt-head-center' },
                    { data: 'aUEC', title: 'In Game Price', searchable: false, render: DataTable.render.number(',', '.', 0, '$'), className: 'dt-body-center dt-head-center' },
                    { data: 'BuyLocation', title: 'Buy Location', searchable: false, className: 'dt-body-center dt-head-center' },

                    { data: 'VehicleSize', title: 'Vehicle Size', searchable: false, className: 'dt-body-center dt-head-center' },
                    {
                        data: 'Weapons', title: 'Weapons',
                        className: 'dt-body-center dt-head-center',
                        render: function (data, type) {
                            if (type === 'display') {
                                if (isValidString(data)) {
                                    return `<a href="#" data-ltype="popHardPoint" data-shipid="${data}">${data}</a>`;
                                }
                                else {
                                    return data;
                                }
                            }
                            return data;
                        }
                    },
                    {
                        data: 'Turrets', title: 'Turrets', searchable: false,
                        className: 'dt-body-center dt-head-center',
                        render: function (data, type) {
                            if (type === 'display') {
                                if (isValidString(data)) {
                                    return `<a href="#" data-ltype="popTurrets" data-shipid="${data}">${data}</a>`;
                                }
                                else {
                                    return data;
                                }
                            }
                            return data;
                        }
                    },
                    {
                        data: 'MissileRacks', title: 'Missile Racks', searchable: false,
                        className: 'dt-body-center dt-head-center',
                        render: function (data, type) {
                            if (type === 'display') {
                                if (isValidString(data)) {
                                    return `<a href="#" data-ltype="popMissiles" data-shipid="${data}">${data}</a>`;
                                }
                                else {
                                    return data;
                                }
                            }
                            return data;
                        }
                    },

                    { data: 'QTDrive', title: 'QT Drive', searchable: false, className: 'dt-body-center dt-head-center' },
                    { data: 'PowPlant', title: 'Power Plant', searchable: false, className: 'dt-body-center dt-head-center' },
                    { data: 'Shields', title: 'Shields', searchable: false, className: 'dt-body-center dt-head-center' },
                    { data: 'ShieldType', title: 'Shield Type', className: 'dt-body-center dt-head-center' },
                    { data: 'HP', title: 'HP', searchable: false, render: DataTable.render.number(',', '.', 0), className: 'dt-body-center dt-head-center' },

                    { data: 'Crew', title: 'Crew Max', searchable: false, className: 'dt-body-center dt-head-center' },
                    { data: 'CargoGrid', title: 'Cargo Grid', className: 'dt-body-center dt-head-center' },
                    { data: 'Inventory', title: 'Inventory', searchable: false, defaultContent: '', className: 'dt-body-center dt-head-center' },
                    { data: 'ScmSpeed', title: 'SCM Speed', type: 'num', searchable: false, defaultContent: '', className: 'dt-body-center dt-head-center' },
                    { data: 'NavSpeed', title: 'NAV Speed', type: 'num', searchable: false, defaultContent: '', className: 'dt-body-center dt-head-center' },
                    {
                        data: 'Agility_PYR', title: 'Agility', defaultContent: '', className: 'dt-body-center dt-head-center',
                        render: function (data, type, row, meta) {
                            if (type === 'display') {
                                if (isValidString(data)) {
                                    const jsonData = row.Name + '|' + data;
                                    return `<a href="#" data-ltype="popAgilty" data-shipid="${jsonData}">${data}</a>`;
                                }
                                else {
                                    return data;
                                }
                            }
                            return data;
                        }
                    },

                    { data: 'Fuel_H', title: 'Hidrogen', type: 'num-fmt', searchable: false, defaultContent: '', render: DataTable.render.number(',', '.', 0), className: 'dt-body-center dt-head-center' },
                    { data: 'Fuel_QT', title: 'Fuel QT', type: 'num', searchable: false, render: DataTable.render.number(',', '.', 0), className: 'dt-body-center dt-head-center' },
                    { data: 'Capacitor', title: 'Weapons Capacitor', type: 'num', searchable: false, render: DataTable.render.number(',', '.', 0), className: 'dt-body-center dt-head-center' },
                    { data: 'CapRefill', title: 'Cap Refill', searchable: false, defaultContent: '', render: DataTable.render.number(',', '.', 0), className: 'dt-body-center dt-head-center' }
                ]
            });

            //al dar Click sobre una Fila de la tabla:
            table.on('click', 'tbody tr', function (e) {
                e.currentTarget.classList.toggle('selected'); //<- Selecciona o des-selecciona la fila actual
                //console.log(e.target);

                var Control = $(e.target); //<- el Control Clickeado, si lo hay
                if (Control != undefined) {
                    const lType = Control.attr("data-ltype"); //<- el tipo de Control
                    if (lType != undefined) {
                        var ShipID = Control.attr("data-shipid");   //<- Datos asociados al Control

                        if (lType === "popImgPreview") {
                            //Establece la Imagen del preview a mostrar y abre un cuadro popup:                            
                            $('#imgShipPreview').attr('src', `img/ships/${ShipID}.jpg`);
                            var timeoutID = window.setTimeout(function () {
                                $("#popShipPreview").popup("open", {
                                    positionTo: 'window',
                                    transition: "flip"
                                });
                            }, 600);
                        }
                        if (lType === "linkShipPageF") {
                            //Abre un link a la pagina de la nave en el Store de RSI
                            if (ShipID != undefined) {
                                window.open('https://robertsspaceindustries.com/pledge/ships/' + ShipID, '_blank');
                            }
                        }
                        if (lType == 'popHardPoint') {
                            ShowHardPointInfo(ShipID);
                        }
                        if (lType == 'popTurrets') {
                            ShowTurretsInfo(ShipID);
                        }
                        if (lType == 'popMissiles') {
                            ShowMissilesInfo(ShipID);
                        }
                        if (lType == 'popAgilty') {
                            ShowAgilityInfo(ShipID);
                        }
                        if (lType == 'popVerticalData') {
                            ShowVerticalGrid_1Column(ShipID);
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

function ShowVerticalGrid_1Column(data) {
    const shipInfo = shipsData.data.find((element) => element.ID == data);

    $('#pVG_lblShipName').html(shipInfo.Name);
    $('#pVG_imgShipFoto').attr('src', `img/ships/${shipInfo.ID}.jpg`);
    $("#pVG_tblVerticalData").empty().append(GetShipTableRows(shipInfo)).enhanceWithin();

    var timeoutID = window.setTimeout(function () {
        $("#popVerticalGrid").popup("open", {
            positionTo: 'window',
            transition: "flip"
        });
    }, 200);
}
function Comare2Ships(ShipA, ShipB) {
    if (ShipA != undefined && ShipB != undefined) {

        //console.log(ShipA); console.log(ShipB);
        ComparingShips = [ShipA, ShipB];

        $("#pVG2cB_tblVerticalData").empty().append(GetCompareTable_2Ships(ShipA, ShipB)).enhanceWithin();

        var timeoutID = window.setTimeout(function () {
            $("#popVerticalGrid2C").popup("open", {
                positionTo: 'window',
                transition: "flip"
            });
        }, 400);
    }
}

/** Extrae la informacion de los hardpoints y los muestra en forma de Tabla
 * @param {string} data Datos del Hardpoint, ejem: '2xS3x2, 1xS4'  */
function ShowHardPointInfo(data) {
    //console.log(data);
    let totHardPoints = 0;
    let totalWeapons = 0;
    let htmTable = '<tr><th>Hardpoints</th><th>Weapons</th></tr>'; //Agrega fila de Titulos  

    let words = data.split(","); //Separa los hardpoints
    words.forEach(word => {
        let X = word.split('x'); // separa las cantidades
        let Hardpoint = parseInt(NVL(X[0], '1'));
        let W = NVL(X[2], '1').toString().split('-');  //<- 4,S2
        let Quantity = parseInt(NVL(W[0], '1')); //<- 4

        totHardPoints += Hardpoint;
        totalWeapons += Quantity * Hardpoint;

        htmTable += GetTableRowsEx(Hardpoint, X[1], X[2]);
    });

    $("#tableHardPoints").empty().append(htmTable).enhanceWithin();
    $('#lblHardPoints').html(`${totHardPoints} Hardpoints, ${totalWeapons} Weapons`);

    var timeoutID = window.setTimeout(function () {
        $("#popDlgHardPoints").popup("open", {
            positionTo: 'window',
            transition: "flip"
        });
    }, 200);
}
function ShowTurretsInfo(data) {
    //console.log(data);
    let totHardPoints = 0;
    let totalWeapons = 0;
    let htmTable = '<tr><th>Turrets</th><th>Hardpoints</th></tr>'; //Agrega fila de Titulos  

    let words = data.split(","); //Separa los hardpoints
    words.forEach(word => {
        let X = word.split('x');  // separa las cantidades
        let Hardpoint = parseInt(NVL(X[0], '1'));
        let W = NVL(X[2], '1').toString().split('-');  //<- 4,S2
        let Quantity = parseInt(NVL(W[0], '1')); //<- 4

        totHardPoints += Hardpoint;
        totalWeapons += Quantity * Hardpoint;

        htmTable += GetTableRowsEx(Hardpoint, X[1], X[2]);
    });

    $("#tableHardPoints").empty().append(htmTable).enhanceWithin();
    $('#lblHardPoints').html(`${totHardPoints} Turrets, ${totalWeapons} Hardpoints`);

    var timeoutID = window.setTimeout(function () {
        $("#popDlgHardPoints").popup("open", {
            positionTo: 'window',
            transition: "flip"
        });
    }, 200);
}
function ShowMissilesInfo(data) {
    //console.log(data);
    let totHardPoints = 0;
    let totalWeapons = 0;
    let htmTable = '<tr><th>Racks</th><th>Missiles</th></tr>'; //Agrega fila de Titulos  

    let words = data.split(","); //Separa los hardpoints
    words.forEach(word => {
        let X = word.split('x');  // separa las cantidades
        let Hardpoint = parseInt(NVL(X[0], '1'));
        let W = NVL(X[2], '1').toString().split('-');  //<- 4,S2
        let Quantity = parseInt(NVL(W[0], '1')); //<- 4

        totHardPoints += Hardpoint;
        totalWeapons += Quantity * Hardpoint;

        htmTable += GetTableRowsEx(Hardpoint, X[1], X[2]);
    });

    $("#tableHardPoints").empty().append(htmTable).enhanceWithin();
    $('#lblHardPoints').html(`${totHardPoints} Racks, ${totalWeapons} Missiles`);

    var timeoutID = window.setTimeout(function () {
        $("#popDlgHardPoints").popup("open", {
            positionTo: 'window',
            transition: "flip"
        });
    }, 200);
}
/** Produce filas de tabla para el Harpoint indicado. * 
 * @param {integer} hardPoint Cantidad de Hardpoints
 * @param {string}  pSize Tamaño del Hardpoint (y de las Armas)
 * @param {integer} Weapons Cantidad de armas en cada Hardpoint */
function GetTableRowsEx(hardPoint = 1, pSize = 'S1', pWeapons = '1') {
    let rowHTML = '';
    try {
        //console.log(`Size:${pSize}`); console.log(`Weapons:${pWeapons}`);

        // Get the Size and Type of the Hardpoint:
        let X = pSize.toString().split('-'); //<- S4,MC
        let hSize = NVL(X[0], 'S1');        //<- S4
        let hType = NVL(X[1], '');          //<- MC        
        const dType = shipsData.HardPointTypes.find((Codigo) => Codigo.ID == hType); //<- Manned Control
        hType = dType ? '<br>' + dType.Name : '';

        // Get the Quantity and Size of the Weapons on each hardpoint:
        let W = pWeapons.toString().split('-');  //<- 4,S2
        let Quantity = parseInt(NVL(W[0], '1')); //<- 4
        let wSize = NVL(W[1], hSize);            //<- S2
        const wType = shipsData.HardPointTypes.find((Codigo) => Codigo.ID == wSize);
        if (wType != undefined) {
            wSize = wType.Name;
        }

        //El color del texto lo determina el tamaño
        const colorMap = {
            "S8": "#ff9428", //<- Orange
            "S7": "#00ff80", //<- Green
            "S6": "#0080c0", //<- Blue
            "S5": "#ff0080", //<- Red
            "S4": "#ff80ff", //<- Pink
            "S3": "#ffff00", //<- Yellow
            "S2": "#ffff80", //<- LightYellow
            "S1": "#ffffff", //<- White
        };
        //ColorPicker:->'style="color:#ff80ff"'
        var rColor = colorMap[wSize.trim().toUpperCase()];
        if (rColor === undefined) { rColor = "#972fff"; } //<- Purple

        for (let Hindex = 0; Hindex < hardPoint; Hindex++) {
            if (Quantity > 1) {
                rowHTML += `<tr><th rowspan="${Quantity}">${hSize} ${hType}</th><td style="color:${rColor}">${wSize}</td></tr>`;
                for (let SpanIndex = 0; SpanIndex < Quantity - 1; SpanIndex++) {
                    rowHTML += `<tr><td style="color:${rColor}">${wSize}</td></tr>`;
                }
            }
            else {
                rowHTML += `<tr><td>${hSize} ${hType}</td><td style="color:${rColor}">${wSize}</td></tr>`;
            }
        }
        //console.log(rowHTML);
    } catch (error) {
        console.log(error);
    }
    return rowHTML;
}
function GetShipTableRows(shipInfo) {
    var htmTable = '';
    if (shipInfo != undefined) {
        htmTable += `<tr><td>Manufacturer:</td><td>${shipsData.Manufacturers.find((element) => element.ID == shipInfo.Manufacturer).Name}</td></tr>`;
        htmTable += `<tr><td>Type:</td><td>${shipsData.Types.find((element) => element.ID == shipInfo.Type).Name}</td></tr>`;
        htmTable += `<tr><td>Career:</td><td>${shipsData.Careers.find((element) => element.ID == shipInfo.Career).Name}</td></tr>`;
        htmTable += `<tr><td>Role:</td><td>${shipInfo.Role}</td></tr>`;

        var Availability = '';
        if (shipInfo.FlyReady === 1) {
            Availability += 'Fly Ready';
        }
        else {
            Availability += 'Concept';
        }
        if (shipInfo.StandAlone === 1) {
            Availability += ', Standalone Sale';
        }

        htmTable += `<tr><td>Availability:</td><td>${Availability}</td></tr>`;
        htmTable += `<tr><td>Pledge USD:</td><td>$ ${formatNumber(shipInfo.PledgeUSD, 0)}</td></tr>`;
        htmTable += `<tr><td>Value aUEC:</td><td>$ ${formatNumber(shipInfo.aUEC, 0)}</td></tr>`;
        htmTable += `<tr><td>Buy Location:</td><td>${shipInfo.BuyLocation}</td></tr>`;
        htmTable += `<tr style='border-bottom:1px solid white'><td>Vehicle Size:</td><td>${shipInfo.VehicleSize}</td></tr>`;

        if (shipInfo.Weapons != '-') {
            htmTable += `<tr><td>Weapons:</td><td><a href="#" data-ltype="popHardPoint" data-shipid="${shipInfo.Weapons}">${shipInfo.Weapons}</a></td></tr>`;
        }
        else { htmTable += `<tr><td>Weapons:</td><td>${shipInfo.Weapons}</td></tr>`; }

        if (shipInfo.Turrets != '-') {
            htmTable += `<tr><td>Turrets:</td><td><a href="#" data-ltype="popTurrets" data-shipid="${shipInfo.Turrets}">${shipInfo.Turrets}</a></td></tr>`;
        }
        else { htmTable += `<tr><td>Turrets:</td><td>${shipInfo.Turrets}</td></tr>`; }

        if (shipInfo.MissileRacks != '-') {
            htmTable += `<tr><td>Missiles:</td><td><a href="#" data-ltype="popMissiles" data-shipid="${shipInfo.MissileRacks}">${shipInfo.MissileRacks}</a></td></tr>`;
        }
        else { htmTable += `<tr><td>Missiles:</td><td>${shipInfo.MissileRacks}</td></tr>`; }

        htmTable += `<tr><td>QT Drive:</td><td>${shipInfo.QTDrive}</td></tr>`;
        htmTable += `<tr><td>Power Plant:</td><td>${shipInfo.PowPlant}</td></tr>`;
        htmTable += `<tr><td>Shields:</td><td>${shipInfo.Shields}</td></tr>`;
        htmTable += `<tr><td>Shield Type:</td><td>${shipInfo.ShieldType}</td></tr>`;
        htmTable += `<tr style='border-bottom:1px solid white'><td>Hull HP:</td><td>${formatNumber(shipInfo.HP, 0)}</td></tr>`;

        htmTable += `<tr><td>Max Crew:</td><td>${shipInfo.Crew}</td></tr>`;
        htmTable += `<tr><td>Cargo Grid:</td><td>${shipInfo.CargoGrid} scu</td></tr>`;
        htmTable += `<tr><td>Inventory:</td><td>${shipInfo.Inventory} scu</td></tr>`;
        htmTable += `<tr><td>SCM Speed:</td><td>${shipInfo.ScmSpeed} m/s</td></tr>`;
        htmTable += `<tr><td>NAV Speed:</td><td>${shipInfo.NavSpeed} m/s</td></tr>`;

        const jsonData = shipInfo.Name + '|' + shipInfo.Agility_PY;
        htmTable += `<tr><td>Agility:</td><td><a href="#" data-ltype="popAgilty" data-shipid="${jsonData}">${shipInfo.Agility_PYR}</a> (Pitch,Yaw,Roll)</td></tr>`;

        htmTable += `<tr><td>Hidrogen:</td><td>${formatNumber(shipInfo.Fuel_H, 0)} L</td></tr>`;
        htmTable += `<tr><td>Fuel QT:</td><td>${formatNumber(shipInfo.Fuel_QT, 0)} L</td></tr>`;
        htmTable += `<tr><td>Capacitor:</td><td>${formatNumber(shipInfo.Capacitor, 0)}</td></tr>`;
        htmTable += `<tr><td>Cap Refill:</td><td>${formatNumber(shipInfo.CapRefill, 0)}</td></tr>`;
    }
    return htmTable;
}
function GetCompareTable_2Ships(ShipA, ShipB) {
    var htmTable = '';
    if (ShipA != undefined && ShipB != undefined) {

        htmTable += `<thead><tr><th colspan="2">${ShipA.Name}</th><th colspan="2">${ShipB.Name}</th></tr>`;
        htmTable += `<tr><th colspan="2"><img src="img/ships/${ShipA.ID}.jpg" alt="" width="300" height="120"></th>`;
        htmTable += `    <th colspan="2"><img src="img/ships/${ShipB.ID}.jpg" alt="" width="300" height="120"></th></tr>`;
        htmTable += '</thead><tbody>';

        htmTable += `<tr><td>Manufacturer:</td><td>${shipsData.Manufacturers.find((element) => element.ID == ShipA.Manufacturer).Name}</td>`;
        htmTable += `<td>${shipsData.Manufacturers.find((element) => element.ID == ShipB.Manufacturer).Name}</td>`;
        htmTable += `<td>${ShipA.Manufacturer !=  ShipB.Manufacturer ? '<a style="color: lightgreen;">Different</a>': '-'}</td></tr>`;

        htmTable += `<tr><td>Type:</td><td>${shipsData.Types.find((element) => element.ID == ShipA.Type).Name}</td>`;
        htmTable += `<td>${shipsData.Types.find((element) => element.ID == ShipB.Type).Name}</td>`;
        htmTable += `<td>${ShipA.Type !=  ShipB.Type ? '<a style="color: lightgreen;">Different</a>': '-'}</td></tr>`;

        htmTable += `<tr><td>Career:</td><td>${shipsData.Careers.find((element) => element.ID == ShipA.Career).Name}</td>`;        
        htmTable += `<td>${shipsData.Careers.find((element) => element.ID == ShipB.Career).Name}</td><td>${ShipA.Career !=  ShipB.Career ? '<a style="color: lightgreen;">Different</a>': '-'}</td></tr>`;
        htmTable += `<tr><td>Role:</td><td>${ShipA.Role}</td><td>${ShipB.Role}</td><td>${ShipA.Role !=  ShipB.Role ? '<a style="color: lightgreen;">Different</a>': '-'}</td></tr>`;

        var Availability_A = (ShipA.FlyReady ? 'Fly Ready' : 'Concept'); Availability_A += ShipA.StandAlone ? ', Standalone Sale' : '';
        var Availability_B = (ShipB.FlyReady ? 'Fly Ready' : 'Concept'); Availability_B += ShipB.StandAlone ? ', Standalone Sale' : '';
        htmTable += `<tr><td>Availability:</td><td>${Availability_A}</td><td>${Availability_B}</td><td>-</td></tr>`;

        htmTable += `<tr><td>Pledge USD:</td><td>$ ${formatNumber(ShipA.PledgeUSD, 0)}</td><td>$ ${formatNumber(ShipB.PledgeUSD, 0)}</td><td>$ ${CompareValues(ShipA.PledgeUSD, ShipB.PledgeUSD, 0, 'USD', true)}</td></tr>`;
        htmTable += `<tr><td>Value aUEC:</td><td>$ ${formatNumber(ShipA.aUEC, 0)}</td><td>$ ${formatNumber(ShipB.aUEC, 0)}</td><td>$ ${CompareValues(ShipA.aUEC, ShipB.aUEC, 0, 'aUEC', true)}</td></tr>`;
        htmTable += `<tr><td>Buy Location:</td><td>${ShipA.BuyLocation}</td><td>${ShipB.BuyLocation}</td><td>-</td></tr>`;
        htmTable += `<tr><td>Vehicle Size:</td><td>${ShipA.VehicleSize}</td><td>${ShipB.VehicleSize}</td><td>${CompareValues(ShipA.VehicleSize, ShipB.VehicleSize, 0, 'size')}</td></tr>`;

        htmTable += '<tr><td>Weapons:</td>';
        htmTable += ShipA.Weapons != '-' ? `<td><a href="#">${ShipA.Weapons}</a></td>` : `<td>${ShipA.Weapons}</td>`;
        htmTable += ShipB.Weapons != '-' ? `<td><a href="#">${ShipB.Weapons}</a></td>` : `<td>${ShipB.Weapons}</td>`; 
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.Weapons), GetHardPointInfo(ShipB.Weapons))}</td></tr>`;

        htmTable += '<tr><td>Turrets:</td>';
        htmTable += ShipA.Turrets != '-' ? `<td><a href="#">${ShipA.Turrets}</a></td>` : `<td>${ShipA.Turrets}</td>`;
        htmTable += ShipB.Turrets != '-' ? `<td><a href="#">${ShipB.Turrets}</a></td>` : `<td>${ShipB.Turrets}</td>`;
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.Turrets), GetHardPointInfo(ShipB.Turrets))}</td></tr>`;

        htmTable += '<tr><td>Missiles:</td>';
        htmTable += ShipA.MissileRacks != '-' ? `<td><a href="#">${ShipA.MissileRacks}</a></td>` : `<td>${ShipA.MissileRacks}</td>`;
        htmTable += ShipB.MissileRacks != '-' ? `<td><a href="#">${ShipB.MissileRacks}</a></td>` : `<td>${ShipB.MissileRacks}</td>`;
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.MissileRacks), GetHardPointInfo(ShipB.MissileRacks))}</td></tr>`;

        htmTable += `<tr><td>QT Drive:</td><td>${ShipA.QTDrive}</td><td>${ShipB.QTDrive}</td>`;
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.QTDrive), GetHardPointInfo(ShipB.QTDrive))}</td></tr>`;

        htmTable += `<tr><td>Power Plant:</td><td>${ShipA.PowPlant}</td><td>${ShipB.PowPlant}</td>`;
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.PowPlant), GetHardPointInfo(ShipB.PowPlant))}</td></tr>`;

        htmTable += `<tr><td>Shields:</td><td>${ShipA.Shields}</td><td>${ShipB.Shields}</td>`;
        htmTable += `<td>${CompareHardPoints(GetHardPointInfo(ShipA.Shields), GetHardPointInfo(ShipB.Shields))}</td></tr>`;

        htmTable += `<tr><td>Shield Type:</td><td>${ShipA.ShieldType}</td><td>${ShipB.ShieldType}</td><td>-</td></tr>`;
        htmTable += `<tr><td>Hull HP:</td><td>${formatNumber(ShipA.HP, 0)}</td><td>${formatNumber(ShipB.HP, 0)}</td><td>${CompareValues(ShipA.HP, ShipB.HP, 0, 'hp')}</td></tr>`;

        htmTable += `<tr><td>Max Crew:</td><td>${ShipA.Crew}</td><td>${ShipB.Crew}</td><td>-</td></tr>`;
        htmTable += `<tr><td>Cargo Grid:</td><td>${ShipA.CargoGrid} scu</td><td>${ShipB.CargoGrid} scu</td><td>${CompareValues(ShipA.CargoGrid, ShipB.CargoGrid, 0, 'scu')}</td></tr>`;
        htmTable += `<tr><td>Inventory:</td><td>${ShipA.Inventory} scu</td><td>${ShipB.Inventory} scu</td><td>${CompareValues(ShipA.Inventory, ShipB.Inventory, 2, 'scu')}</td></tr>`;
        htmTable += `<tr><td>SCM Speed:</td><td>${ShipA.ScmSpeed} m/s</td><td>${ShipB.ScmSpeed} m/s</td><td>${CompareValues(ShipA.ScmSpeed, ShipB.ScmSpeed, 0, 'm/s')}</td></tr>`;
        htmTable += `<tr><td>NAV Speed:</td><td>${ShipA.NavSpeed} m/s</td><td>${ShipB.NavSpeed} m/s</td><td>${CompareValues(ShipA.NavSpeed, ShipB.NavSpeed, 0, 'm/s')}</td></tr>`;

        htmTable += `<tr><td>Pitch,Yaw,Roll:</td><td><a href="#">${ShipA.Agility_PYR}</a></td><td><a href="#">${ShipB.Agility_PYR}</a></td>`;
        htmTable += `<td>${CompareAgilityHTML(ShipA.Agility_PYR, ShipB.Agility_PYR)}</td></tr>`;

        htmTable += `<tr><td>Hidrogen:</td><td>${formatNumber(ShipA.Fuel_H, 0)} L</td><td>${formatNumber(ShipB.Fuel_H, 0)} L</td><td>${CompareValues(ShipA.Fuel_H, ShipB.Fuel_H, 0, 'L')}</td></tr>`;
        htmTable += `<tr><td>Fuel QT:</td><td>${formatNumber(ShipA.Fuel_QT, 0)} L</td><td>${formatNumber(ShipB.Fuel_QT, 0)} L</td><td>${CompareValues(ShipA.Fuel_QT, ShipB.Fuel_QT, 0, 'L')}</td></tr>`;
        htmTable += `<tr><td>Capacitor:</td><td>${formatNumber(ShipA.Capacitor, 0)}</td><td>${formatNumber(ShipB.Capacitor, 0)}</td><td>${CompareValues(ShipA.Capacitor, ShipB.Capacitor)}</td></tr>`;
        htmTable += `<tr><td>Cap Refill:</td><td>${formatNumber(ShipA.CapRefill, 0)}</td><td>${formatNumber(ShipB.CapRefill, 0)}</td><td>${CompareValues(ShipA.CapRefill, ShipB.CapRefill)}</td></tr>`;
    }
    return htmTable;
}

function ShowAgilityInfo(data) {
    if (data != undefined) {
        var mSeleccionado = $('#agilCboShips option:selected');
        const jsonData = data.toString().split('|');
        if (jsonData != undefined) {

            const agilData_A = GetAgility(jsonData[1]); //console.log(agilData);
            if (agilData_A != undefined) {
                $('#agilTxtShipName').val(jsonData[0]);
                $('#agilTxtShipName').attr('data-ship', jsonData[1]);

                $('#agilTxtP_1').val('Pitch: ' + agilData_A.pitch);
                $('#agilTxtY_1').val('Yaw:   ' + agilData_A.yaw);
                $('#agilTxtR_1').val('Roll:  ' + agilData_A.roll);
            }

            const dataB = mSeleccionado.data("datos"); //<- Obtiene los datos del elemento seleccionado
            if (dataB != undefined) {
                const agilData_B = GetAgility(dataB.Agility_PYR);
                const agilityComparison = calculateAgilityPercentage(agilData_A, agilData_B);
                $('#lblCompareAgility').html(agilityComparison);
            }

            var timeoutID = window.setTimeout(function () {
                $("#popAgilty").popup("open", {
                    positionTo: 'window',
                    transition: "flip"
                });
            }, 200);
        }
    }
}
/** Converts the agility from an string to an Object * 
 * @param {*} data Agility values in string form (P/Y/R), example: '50/50/50'
 * @returns an object with the data  */
function GetAgility(data) {
    if (data != undefined && data != '') {
        const agil = data.toString().split('/'); //console.log(agil);
        return {
            pitch: parseInt(NVL(agil[0], '0')),
            yaw: parseInt(NVL(agil[1], '0')),
            roll: parseInt(NVL(agil[2], '0')),
        };
    }
}
function calculateAgilityPercentage(vehicleA, vehicleB) {
    // Calculate the absolute difference for each agility metric (pitch, yaw, roll).
    const pitchDiff = Math.abs(vehicleA.pitch - vehicleB.pitch);
    const yawDiff = Math.abs(vehicleA.yaw - vehicleB.yaw);
    const rollDiff = Math.abs(vehicleA.roll - vehicleB.roll);

    // Calculate the sum of the absolute differences.
    const totalDiff = pitchDiff + yawDiff + rollDiff;

    // Calculate the average agility of vehicles A and B.
    const averageAgility = (vehicleA.pitch + vehicleA.yaw + vehicleA.roll +
        vehicleB.pitch + vehicleB.yaw + vehicleB.roll) / 6;

    // Calculate the percentage difference in agility.
    const percentageDifference = (totalDiff / averageAgility) * 100;

    // Determine which vehicle is more agile.
    if (percentageDifference === 0) {
        return "The vehicles have the same agility.";
    } else if (vehicleA.pitch + vehicleA.yaw + vehicleA.roll > vehicleB.pitch + vehicleB.yaw + vehicleB.roll) {
        return `Vehicle A is ${percentageDifference.toFixed(1)}% more agile than vehicle B.`;
    } else {
        return `Vehicle B is ${percentageDifference.toFixed(1)}% more agile than vehicle A.`;
    }
}
function CompareAgilityHTML(agilData_A, agilData_B) {
    // Calculate the absolute difference for each agility metric (pitch, yaw, roll).
    if (agilData_A != agilData_B) {
        const vehicleA = GetAgility(agilData_A); 
        const vehicleB = GetAgility(agilData_B);

        //console.log(vehicleA);console.log(vehicleB);
        const pitchDiff = Math.abs(vehicleA.pitch - vehicleB.pitch);
        const yawDiff = Math.abs(vehicleA.yaw - vehicleB.yaw);
        const rollDiff = Math.abs(vehicleA.roll - vehicleB.roll);

        // Calculate the sum of the absolute differences.
        const totalDiff = pitchDiff + yawDiff + rollDiff;

        // Calculate the average agility of vehicles A and B.
        const averageAgility = (vehicleA.pitch + vehicleA.yaw + vehicleA.roll +
            vehicleB.pitch + vehicleB.yaw + vehicleB.roll) / 6;

        // Calculate the percentage difference in agility.
        const percentageDifference = (totalDiff / averageAgility) * 100;
        //console.log(percentageDifference);

        // Determine which vehicle is more agile.
        var _ret = '';
        if (percentageDifference === 0) {
            return "-";
        } else if (vehicleA.pitch + vehicleA.yaw + vehicleA.roll > vehicleB.pitch + vehicleB.yaw + vehicleB.roll) {
            _ret = `${percentageDifference.toFixed(1)}%`;
            return `<a style="color: lightgreen;">${_ret}</a> more agile`;
        } else {
            _ret = `${percentageDifference.toFixed(1)}%`;
            return `<a style="color: lightcoral;">${_ret}</a> less agile`;
        }
    } else {
        return '-';
    }    
}

function GetHardPointInfo(data) {
    //console.log(data); //<- 'data' = '2xS3-LCx4-S2, 1xS4'
    let totHardPoints = 0;
    let totalWeapons = 0;
    let MaxSize = 0;

    if (data != undefined && data != '' && data != '-') {
        let words = data.split(","); //Separa los hardpoints: ['2xS3-LCx4-S2','1xS4']
        words.forEach(word => {
            let X = word.split('x'); // separa las cantidades: ['2', 'S3-LC', '4-S2']
            //console.log(X);
            let Hardpoint = parseInt(NVL(X[0], '1'));
            let W = NVL(X[2], '1').toString().split('-');  //<- 4,S2
            //console.log(W);
            let Quantity = parseInt(NVL(W[0], '1')); //<- 4

            let Size = GetSize(X[1]);
            if (Size > MaxSize) { MaxSize = Size; }

            totHardPoints += Hardpoint;
            totalWeapons += Quantity * Hardpoint;

            //htmTable += GetTableRowsEx(Hardpoint, X[1], X[2]);
        });
    }
    return {
        Info: data,
        HardpointsCount: totHardPoints,
        WeaponsCount: totalWeapons,
        MaxSize: MaxSize
    }
}
function GetSize(data) {
    var _ret = 0;
    if (data != undefined && data != '') {
        switch (data) {
            case 'S0': _ret = 0; break;
            case 'S1': _ret = 1; break;
            case 'S2': _ret = 2; break;
            case 'S3': _ret = 3; break;
            case 'S4': _ret = 4; break;
            case 'S5': _ret = 5; break;
            case 'S6': _ret = 6; break;
            case 'S7': _ret = 7; break;
            case 'S8': _ret = 8; break;
            case 'S9': _ret = 9; break;
            case 'S10': _ret = 10; break;
            default: _ret = 0; break;
        }
    }
    return _ret;
}
/* ---------------------- UTILITY FUNCTIONS ---------------------------------------------- */
function isValidString(text) {
    return text !== null && text !== "-" && text !== "";
}

function verificarCaptcha() {
    console.log('Respuesta del Captcha:');
    console.log(grecaptcha.getResponse());
    $('#Captcha_Container').fadeOut();
    var timeoutID = window.setTimeout(showPopUp, 1000); //<- Espera 1 segundo y muestra la ventana de Login
}

function getImagePath(id) {
    // Construct the base image path
    const basePath = "img/ships/";

    // Validate the ID format (3 or 4 digits)
    if (!/^\d{3,4}$/.test(id)) {
        console.error("Invalid image ID format. Must be 3 or 4 digits.");
        return null; // Or return a default image path if needed
    }

    // Build the complete image path with padding for 3-digit IDs
    let filename;
    if (id.length === 3) {
        // Prepend a leading zero for 3-digit IDs
        filename = "0" + id + ".jpg"; // Adjust extension based on your images
    } else {
        // Use the ID directly for 4-digit IDs
        filename = id + ".jpg"; // Adjust extension based on your images
    }

    const imagePath = basePath + filename;

    return imagePath;
}

function NVL(data, defValue = '') {
    if (data != undefined) {
        return data.toString().trim();
    }
    return defValue;
}
function CompareValues(ValueA = 0.0, ValueB = 0.0, decimalPlaces = 0, Suffix = '', Inverted = false) {
    var _ret = '-';
    const Value = ValueA - ValueB;
    if (ValueA != ValueB) {
        _ret = formatNumHTML(Value, decimalPlaces, Inverted) + ' ' + Suffix;
    }
    return _ret;
}
function CompareHardPoints(HardpointA, HardpointB) {
    var _ret = '-';
    var Color = 'white'; 
    
    if (HardpointA != HardpointB) {
        var Weapons = HardpointA.WeaponsCount - HardpointB.WeaponsCount;
        if (HardpointA.WeaponsCount != HardpointB.WeaponsCount) {
            if (HardpointA.WeaponsCount > HardpointB.WeaponsCount) {
                Color = 'lightgreen';
                Weapons = '+' + Weapons;
            } else {
                Color = 'lightcoral';
            }
            _ret = `<a style="color: ${Color};">${Weapons}</a> Count`;
        }

        var SizeDiff = HardpointA.MaxSize - HardpointB.MaxSize;
        if (HardpointA.MaxSize != HardpointB.MaxSize ) {
            if (HardpointA.MaxSize > HardpointB.MaxSize) {
                Color = 'lightgreen';
                SizeDiff = '+' + SizeDiff;
            } else {
                Color = 'lightcoral';
            }
            _ret += ` <a style="color: ${Color};">${SizeDiff}</a> Size`;
        }
    } 
    return _ret;
}

/** Aplica Formato a un Numero, con Decimales y Separador de Millares. 
 * @param {*} number El Numero que queremos formatear
 * @param {*} decimals Cantidad de Decimales a mostrar, x Defecto 2
 * @param {*} separator Simbolo de Millares, x Defecto ','
 * @returns Una Cadena con el numero formateado
 */
function formatNumber(number, decimals = 2, separator = ',') {
    // Ensure valid number input
    if (isNaN(number)) {
        return number; // Return the original value if not a number
    }

    // Use toLocaleString() for locale-aware formatting (recommended)
    return number.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    // Alternative using toFixed() for simpler formatting
    // const fixedNumber = number.toFixed(decimals);
    // return fixedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
// Function to format and display the number with swapped sign
function formatDecimal(numberString, decimalPlaces) {
    // 1. Convert string to absolute decimal using Math.abs()
    const absoluteNumber = Math.abs(parseFloat(numberString));

    // 2. Round to the specified number of decimal places
    const roundedNumber = Math.round(absoluteNumber * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);

    // 3. Convert back to string and remove sign using toFixed()
    return roundedNumber.toFixed(decimalPlaces).replace(/^-/, "");
}

function formatNumHTML(number, decimalPlaces = 0, invertGoodBad = false) {

    const isNegative = number < 0;
    const Sign = number > 0 ? '+' : '';

    // Swap the sign of the number
    number = -number;

    // Convert the number to a string with the specified number of decimal places
    var result = number.toFixed(decimalPlaces);
    result = Math.abs(result);

    // Add a thousands separator
    result = parseFloat(result).toLocaleString('en-US', { minimumFractionDigits: decimalPlaces });
    //

    // Add a '+' sign in front of positive numbers
    result = number > 0 ? '-' + result : '+' + result;

    var Color = 'white'; //console.log(sign + invertGoodBad);
    if (isNegative === false) {
        Color = invertGoodBad ? 'lightcoral' : 'lightgreen';
    } else {
        Color = invertGoodBad ? 'lightgreen' : 'lightcoral';
    }

    return `<a style="color: ${Color};">${result}</a>`;
}

function downloadObjectAsJson(exportObj, exportName) {
    /* Descarga los datos de todas las naves en un archivo JSON */
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, undefined, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function showMessage(pTitle, pMessage) {
    /* Muestra un Mensjaje con Titulo */
    $('#lblMensaje').html('<h2>' + pTitle + '</h2><p>' + pMessage + '</p>');
    $("#popMensaje").popup("open", {
        positionTo: 'window',
        transition: "flip"
    });
}

function hidePopUp() {
    $("#myPopup").popup("close");
    $("#contenido").show();
}

function ShowLoading(pText) {
    var interval = setInterval(function () {
        $.mobile.loading("show", { textonly: "true", text: pText, textVisible: true, theme: "a", html: "" });
        clearInterval(interval);
    }, 1);
}
function HideLoading() {
    var interval = setInterval(function () {
        $.mobile.loading('hide');
        clearInterval(interval);
    }, 1);
}

function urlParam(pNombreParametro) {
    //Esta funcion devuelve el valor del parametro especificado si existe
    var results = new RegExp('[\\?&]' + pNombreParametro + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    } else {
        return results[1] || 0;
    }
}

function supports_html5_storage() {
    //Verifica el soperte del navegador para HTML5 y Local Storage
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

