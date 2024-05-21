var usuario_logeado = null;
var jsonConfig = null;
var shipsData = null;
var tableData = null;
var currentShip = null;

//Esto se usa para leer archivos desde JQuery:
var files;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var fs = null;

// https://craftpip.github.io/jquery-confirm

function Iniciar() {
    try {
        //Load data from a JSON file:
        ShowLoading('Loading..');
        $.getJSON('data/sc_ships_ccu.json', function (data) {
            shipsData = data; //console.log(shipsData);
            SetShipsDataTable_OLD(shipsData);
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

    //Al cambiar de pagina
    $(':mobile-pagecontainer').pagecontainer({
        change: function (event, ui) {
            //console.log(ui);
            if (ui.toPage.prop("id") == "pageTable") {
                CargarListaDatosManufac(shipsData.data, '#listShips');
                CargarListaDatos(shipsData.data, '#listShipCCU');
                CargarComboDatos(shipsData.Manufacturers, '#cboManufacturers');
                CargarComboDatos(shipsData.Types, '#cboShipTypes');
                CargarComboDatos(shipsData.Careers, '#cboCarreers');

                // Enable or Disable Controls:
                if (true) {
                    $('#cboManufacturers').attr("disabled", "disabled");
                    $('#cboShipTypes').attr("disabled", "disabled");
                    $('#cboCarreers').attr("disabled", "disabled");

                    $('#txtShipName').attr("disabled", "disabled");
                    $('#txtShipRole').attr("disabled", "disabled");
                    $('#numGamePrice').attr("disabled", "disabled");
                    $('#numPledgePrice').attr("disabled", "disabled");
                }
            }
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
    $('#DivScrollTable').mCustomScrollbar({
        axis: "yx",
        theme: "dark",
        alwaysShowScrollbar: 2,
        //setLeft: "1000px"
    });
}

function SetShipsDataTable_OLD(shipsDataRaw) {
    try {
        //console.log(shipsDataRaw);
        if (shipsDataRaw != null && shipsDataRaw.data.length > 0) {

            const table = new DataTable('#TableOfShips', {
                select: true,
                scrollX: true,
                scrollY: '64vh',
                colReorder: true,
                className: 'nowrap',
                data: shipsDataRaw.data,
                scrollCollapse: true,
                orderMulti: true,
                paging: false,
                layout: {
                    top1: {
                        searchPanes: {
                            columns: [1, 3, 5, 6, 7],
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
                                        var Filter = '';
                                        for (let index = 0; index < SelectedRows.length; index++) {
                                            //console.log(SelectedRows[index]); 
                                            Filter += '\\b' + SelectedRows[index].ID + '\\b|';
                                        }
                                        Filter = Filter.slice(0, -1);
                                        //console.log(Filter);
                                        table.column(0).search(Filter, true, true).draw();
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
                        render: function (data, type, row, meta) {
                            if (type === 'display') {        
                                // Agrega 2 Botones: un link a la pagina del Store y una Imagen preview         
                                var storeLink = row.StorePage; //'aegis-avenger/Avenger-Titan-Renegade'; //              
                                let controls =  `<a href="#" data-ltype="linkShipPageF" data-shipid="${storeLink}" class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-info ui-btn-icon-notext">RSI Page</a>`;
                                    controls += `<a href="#" data-ltype="popImgPreview" data-shipid="${data}"      class="my-tooltip-btn ui-btn ui-alt-icon ui-nodisc-icon ui-btn-inline ui-icon-camera ui-btn-icon-notext">Preview</a>`;
                                return controls;
                            }
                            return data;
                        }
                    },
                    {   //index: 0
                        data: 'Manufacturer',
                        title: 'Manufacturer',
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
                    {   //index: 1
                        data: 'Name', title: 'Name',
                        render: function (ShipID, type, row, meta) {
                            if (type === 'display') {
                                // Colorear en rojo si la nave no es FlyReady o en Verde si esta en venta sin paquete
                                let color = 'white';
                                if (row.FlyReady === 0) { color = 'red'; }
                                else {
                                    if (row.StandAlone === 1) { color = 'green'; }
                                }
                                //
                                return `<span style="color:${color}">${ShipID}  </span>`;
                            }
                            return ShipID;
                        }
                    },
                    {   //index: 2
                        data: 'FlyReady', title: 'FlyReady', searchable: false,
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
                    {   //index: 3
                        data: 'StandAlone', title: 'StandAlone', searchable: false,
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
                    {   //index: 4
                        data: 'Type', title: 'Type',
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Types.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return ShipID;
                        }
                    },
                    {   //index: 5
                        data: 'Career', title: 'Career',
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Careers.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return ShipID;
                        }
                    },
                    { data: 'Role', title: 'Role' },  //index: 7
                    { data: 'PledgeUSD', title: 'Pledge USD', searchable: false, render: DataTable.render.number(',', '.', 0, '$') },
                    { data: 'aUEC', title: 'In Game Price', searchable: false, render: DataTable.render.number(',', '.', 0, '$') },
                    { data: 'BuyLocation', title: 'Buy Location', searchable: false },

                    { data: 'VehicleSize', title: 'Vehicle Size', searchable: false },
                    { data: 'Weapons', title: 'Weapons' },
                    { data: 'Turrets', title: 'Turrets', searchable: false },
                    { data: 'MissileRacks', title: 'Missile Racks', searchable: false },

                    { data: 'QTDrive', title: 'QT Drive', searchable: false },
                    { data: 'PowPlant', title: 'Power Plant', searchable: false },
                    { data: 'Shields', title: 'Shields', searchable: false },
                    { data: 'ShieldType', title: 'Shield Type' },
                    { data: 'HP', title: 'HP', searchable: false, render: DataTable.render.number(',', '.', 0) },

                    { data: 'Crew', title: 'Crew Max', searchable: false },
                    { data: 'CargoGrid', title: 'Cargo Grid' },
                    { data: 'Inventory', title: 'Inventory', searchable: false, defaultContent: '' },
                    { data: 'ScmSpeed', title: 'Scm Speed', type: 'num', searchable: false, defaultContent: '' },
                    { data: 'Agility_PYR', title: 'Agility_PYR', defaultContent: '' },

                    { data: 'Fuel_H', title: 'Hidrogen', type: 'num-fmt', searchable: false, defaultContent: '', render: DataTable.render.number(',', '.', 0) },
                    { data: 'Fuel_QT', title: 'Fuel QT', type: 'num', searchable: false, render: DataTable.render.number(',', '.', 0) },
                    { data: 'Capacitor', title: 'Weapons Capacitor', type: 'num', searchable: false, render: DataTable.render.number(',', '.', 0) },
                    { data: 'CapRefill', title: 'Cap Refill', searchable: false, defaultContent: '', render: DataTable.render.number(',', '.', 0) }
                ]
            });

            //al dar Click sobre una Fila de la tabla:
            table.on('click', 'tbody tr', function (e) {
                e.currentTarget.classList.toggle('selected'); //<- Selecciona o des-selecciona la fila actual
                //console.log(e.target);

                var Control = $(e.target); //<- el Control Clickeado, si lo hay
                if (Control != undefined) {
                    //console.log(Control);
                    const lType = Control.attr("data-ltype"); //<- el tipo de Control

                    if (lType != undefined) {
                        var ShipID = Control.attr("data-shipid");   //<- Datos asociados al Control

                        if (lType === "popImgPreview") {
                            //console.log(ShipID);
                            //Establece la Imagen del preview a mostrar y abre un cuadro popup:                            
                            $('#imgShipPreview').attr('src', `img/ships/${ShipID}.jpg`);
                            //$('#popShipPreview').popup("open", { positionTo: 'window', transition: "flip" });        
                            var timeoutID = window.setTimeout(function(){
                                $( "#popShipPreview" ).popup("open", {
                                      positionTo: 'window',
                                      transition: "flip"
                                  })
                           }, 300);                                               
                        }
                        if (lType === "linkShipPageF") {
                            //Abre un link a la pagina de la nave en el Store de RSI
                            //console.log(ShipID);
                            if (ShipID != undefined) {
                                window.open('https://robertsspaceindustries.com/pledge/ships/' + ShipID, '_blank');
                            }
                        }
                    }
                }
            });

        }
    } catch (error) {
        console.log(error);
    }
}
/* ---------------------- UTILITY FUNCTIONS ---------------------------------------------- */
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

/*  TO BE DELETED */
function LogearUsuario() {
    //Valida al usuario contra el sistema de seguridad, usa AJAX para establecer la conexion, obtiene datos en formato JSON.
    var bLogedUser = false;
    try {
        var pUser = $("#txtUserName").val();
        var pPass = $("#txtPassword").val();

        if (pUser != '' && pPass != '') {
            ShowLoading('Validando..'); //<- Muestra el Loader

            //La ruta del servidor se carga desde el archivo de configuracion:
            //http://localhost/fase3web/?query=u_getinfo&user=244145&pass=5462
            var pUrl = jsonConfig.web_services.default.url + "/?query=u_getinfo&user=" + pUser + "&pass=" + pPass;

            $.ajax({
                url: pUrl,
                dataType: 'json',
                async: true,
                success: function (u_login) {
                    if (u_login !== null) {
                        //console.log(u_login);
                        $("#lblLogin").text(u_login.nombre_usuario);
                        var timeoutID = window.setTimeout(hidePopUp, 500);
                        usuario_logeado = u_login;

                        //IniciarSesion();
                        $(":mobile-pagecontainer").pagecontainer("change", '#pageChat', { transition: 'slidefade' });

                        //Transitions: fade, pop, flip, turn, flow, slide, slidefade, slideup, slidedown, none

                    } else {
                        HideLoading(); //<-Oculta el loader
                        $("#lblLogin").text("No se pudo validar al usuario!");

                        new Noty({
                            type: 'error', layout: 'centerLeft', theme: 'relax',
                            text: "Usuario o Clave Incorrectos, intente de nuevo",
                            timeout: 5000, progressBar: true, closeWith: ['click', 'button'],
                            animation: { open: 'noty_effects_open', close: 'noty_effects_close' }
                        }).show();
                    }

                },
                error: function (err) {
                    console.log('ERROR INESPERADO: ' + err.responseText);
                    HideLoading(); //<-Oculta el loader
                    $.alert({ title: 'Error:', content: err.responseText, useBootstrap: false });
                }
            });
            $.mobile.loading("hide"); //<-Oculta el loader
        }
    } catch (e) {
        $.alert({ title: e.name, content: e.message, useBootstrap: false });
    }
    return bLogedUser;
}
