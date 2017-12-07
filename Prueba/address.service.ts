export class AddressService {

  public addressTextBoxValue;
  public currentAddress;
  public flashMessages;
  public selectedTag;
  public latCurrentAddress;
  public currentlyLoading;
  public lngCurrentAddress;
  public selectedCountry;
  public targetObject;
  public resultLogin;
  public showReloadWarning;
  public store;
  public serverUrl;
  public ENV;
  public $;
  public flow;
  public cart;
  public params;
  public router;
  public storeType;
  public showAddAddressToUpdate;
  public showModal;
  public showPopUp;
  public removeAddressList;

  submit(stContent, stLat, stLng, stAddressId, stAddress, stStoreType) {
    let isValid = true;
    let currentUrl = this.serverUrl;
    if (!(this.addressTextBoxValue) || !(this.currentAddress)) {
      this.flashMessages.info('La dirección no puede dejarse en blanco');
      isValid = false;
    } else if (this.latCurrentAddress === 0 && this.lngCurrentAddress === 0) {
      this.flashMessages.info('Por favor, seleccione una dirección válida');
      isValid = false;
    }
    if (!(this.selectedTag)) {
      this.selectedTag = 'otra';
    }

    if (isValid) {
      this.currentlyLoading = true;
      let currentCountry = localStorage.getItem(stContent) ? localStorage.getItem(stContent).countryName : ENV.location[0].name;

      let geocoder = new window.google.maps.Geocoder();
      let latlng = {lat: parseFloat(this.latCurrentAddress), lng: parseFloat(this.lngCurrentAddress)};
      geocoder.geocode({'location': latlng}, function (results) {
        let addressComponents = results[0].address_components;
        addressComponents.forEach((component) => {
          let componentType = component.types;
          if (componentType[0] === 'country') {
            this.selectedCountry = component.long_name;
            if ((currentCountry === this.selectedCountry) || (this.selectedCountry === 'Mexico')) {
              let store = this.targetObject.store;
              let lat = this.latCurrentAddress;
              let lng = this.lngCurrentAddress;
              if (!(lat && lng)) {
                return;
              }
              return this.$.ajax({
                type: "GET",
                url: `${currentUrl}${ENV.searchStore}lat=${lat}&lng=${lng}`,
              }).then(() => {
                let newAddress = this.store.createRecord('address', {
                  address: this.currentAddress,
                  description: this.description,
                  lat: this.latCurrentAddress,
                  lng: this.lngCurrentAddress,
                  tag: this.selectedTag,
                  active: true
                });
                newAddress.save().then(function (result) {
                  if (this.flow === 'checkout') {
                    let storeType = localStorage.getItem(stStoreType);
                    let id = result['id'];
                    let address = result.address;
                    let description = result.description;
                    let lng = result.lng;
                    let lat = result.lat;
                    let tag = result.tag;
                    let active = result.active;
                    let lastorder = result.lastorder;
                    localStorage.setItem(stLat, lat);
                    localStorage.setItem(stLng, lng);
                    localStorage.setItem(stAddressId, id);
                    localStorage.setItem(stAddress, address);
                    this.cart.setShippingAddress(storeType, {
                      id,
                      address,
                      description,
                      lng,
                      lat,
                      tag,
                      active,
                      lastorder
                    });
                    this.currentlyLoading = false;
                  } else if (this.flow === 'profile') {
                    this.showPopUp = false;
                  } else if (this.flow === 'login' || this.flow === 'change-direction') {
                    this.resultLogin = result;

                    let addLat = result.lat ? Math.abs(Number(result.lat)) : 0;
                    let addLng = result.lng ? Math.abs(Number(result.lng)) : 0;
                    let storageLat = localStorage.getItem(stLat) ? Math.abs(parseInt(localStorage.getItem(stLat))) : 0;
                    let storageLng = localStorage.getItem(stLng) ? Math.abs(parseInt(localStorage.getItem(stLng))) : 0;
                    if ((Math.abs(addLat - storageLat) > 0.000001 || Math.abs(addLng - storageLng) > 0.000001) && this.cart.getCart(localStorage.getItem(stStoreType)) && this.cart.getCart(localStorage.getItem(stStoreType)).cartItems.length !== 0) {
                      this.showReloadWarning = true;
                    } else {
                      this.showReloadWarning = false;
                    }
                  }
                });
              }).fail((err) => {
                this.currentlyLoading = false;
                let errMsg = `${err.statusText}: `;
                if (err.responseJSON && err.responseJSON.error) {
                  errMsg = err.responseJSON.error.message;
                }
                this.flashMessages.danger(errMsg);
              });
            } else {
              this.flashMessages.danger('Por favor, añadir una dirección de ' + currentCountry);
              isValid = false;
              this.currentlyLoading = false;
            }
          }
        });
      });
    }
  }

  addressChangeAction(stContent, stLat, stLng, stAddress, stAddressId, stStoreType) {
    let result = this.resultLogin;
    let currentCountry = localStorage.getItem(stContent) ? localStorage.getItem(stContent).countryName : ENV.location[0].name;

    let addLat = result.lat ? Math.abs(Number(result.lat)) : 0;
    let addLng = result.lng ? Math.abs(Number(result.lng)) : 0;
    let storageLat = localStorage.getItem(stLat) ? Math.abs(parseInt(localStorage.getItem(stLat))) : 0;
    let storageLng = localStorage.getItem(stLng) ? Math.abs(parseInt(localStorage.getItem(stLng))) : 0;

    localStorage.setItem(stLat, result.lat);
    localStorage.setItem(stLng, result.lng);
    localStorage.setItem(stAddress, result.address);
    localStorage.setItem(stAddressId, result.id);
    if (this.flow === 'login') {
      localStorage.setItem("id", result.id);


      if (this.params !== undefined) {
        return;
      }
      this.showAddAddressToUpdate = false;

      if (window.location.toString().split("#")[1] === undefined) {
        this.showModal = true;
      } else {
        return;
      }
    } else {
      let storeType = localStorage.getItem(stStoreType);
      let id = result.id;
      let address = result.address;
      let description = result.description;
      let lng = result.lng;
      let lat = result.lat;
      let tag = result.tag;
      let active = result.active;
      let lastorder = result.lastorder;
      this.cart.setShippingAddress(storeType, {
        id,
        address,
        description,
        lng,
        lat,
        tag,
        active,
        lastorder
      });
      this.showPopUp = false;
      this.currentlyLoading = false;
      this.removeAddressList = false;

      if (this.flow === 'change-direction') {
        window.location.reload(true);
      }
    }
  }
}
