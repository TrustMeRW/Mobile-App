import locationData from "@/constants/location.json";

class RwandaLocations {
  allData:any
  constructor() {
    this.allData = locationData;
  }

  getProvinces() {
    return Object.keys(this.allData).sort();
  }

  getDistricts(province:string) {
    try {
      const data = this.allData[province];
      return Object.keys(data).sort();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  getSectors(province:string, district:string) {
    try {
      const data = this.allData[province][district];
      return Object.keys(data).sort();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  getCells(province:string, district:string, sector:string) {
    try {
      const data = this.allData[province][district][sector];
      return Object.keys(data).sort();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  getVillages(province:string, district:string, sector:string, cell:string) {
    try {
      const data = this.allData[province][district][sector][cell];
      return data.sort();
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}

const rwandaLocations = new RwandaLocations();



export default rwandaLocations;