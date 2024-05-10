
var shipsData = null;
Iniciar();

function Iniciar() {
    try {
        console.log('iNICIANDO..');

        //Load data from a JSON file:
        $.getJSON('data/sc_ships_ccu.json', function (data) {

            shipsData = data;
            //console.log(shipsData);  

            new DataTable('#example', {
                select: true,                
                scrollX: true,
                //scrollY: '700px',
                scrollY: '74vh',
                data: shipsData.data,
                scrollCollapse: true,
                orderMulti: true,
                paging: false,
                
                columns: [
                    { data: 'Name', title: 'Name' },
                    {
                        data: 'Manufacturer',
                        title: 'Manufacturer',
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Manufacturers.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return data;
                        }
                    },
                    {
                        data: 'Type', title: 'Type',
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Types.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return data;
                        }
                    },
                    {
                        data: 'Career', title: 'Career', 
                        render: function (ShipID, type) {
                            if (type === 'display') {
                                const found = shipsData.Careers.find((element) => element.ID == ShipID);
                                if (found != null) {
                                    return found.Name;
                                }
                            }
                            return data;
                        }
                    },
                    { data: 'Role', title: 'Role', width: '20%' },
                    { data: 'PledgeUSD', title: 'Pledge USD', searchable: false, render: DataTable.render.number(',', '.', 0, '$') },
                    { data: 'aUEC', title: 'In Game Price', searchable: false, render: DataTable.render.number(',', '.', 0, '$') },
                    { data: 'BuyLocation', title: 'Buy Location', searchable: false, width: '800px' },

                    { data: 'VehicleSize', title: 'Vehicle Size' },
                    { data: 'Weapons', title: 'Weapons' },
                    { data: 'Turrets', title: 'Turrets' },
                    { data: 'MissileRacks', title: 'Missile Racks' }, //  

                    { data: 'Shields', title: 'Shields' },
                    { data: 'QTDrive', title: 'QT Drive' },
                    { data: 'PowPlant', title: 'Power Plant' },

                    { data: 'Crew', title: 'Crew Max' },
                    { data: 'CargoGrid', title: 'Cargo Grid' },
                    { data: 'Inventory', title: 'Inventory', searchable: false, defaultContent: '' },
                    { data: 'ScmSpeed', title: 'ScmSpeed', type: 'num', searchable: false, defaultContent: ''  },
                    { data: 'Agility_PYR', title: 'Agility_PYR', defaultContent: ''  },
                    { data: 'Fuel_H', title: 'Hidrogen', type: 'num-fmt', searchable: false, defaultContent: ''  },
                    { data: 'Fuel_QT', title: 'Fuel QT', type: 'num', searchable: false },
                    { data: 'Capacitor', title: 'Weapons Capacitor', type: 'num', searchable: false, defaultContent: ''  },
                    { data: 'CapRefill', title: 'Cap Refill', searchable: false, defaultContent: ''  },
                    { data: 'HP', title: 'HP', searchable: false },
                    { data: 'ShieldType', title: 'Shield Type' }
                ]
            });
        });



    } catch (e) {
        $.alert({ title: e.name, content: e.message, useBootstrap: false });
    }

    /* AQUI VAN EVENTOS DE CONTROLES */
    // $('#example').DataTable();

}
/******* AQUI VAN OTRAS FUNCIONES COMPLEMENTARIAS ***************/

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