export enum VehicleType {
    Car = 'Car',
    Motorbike = 'Motorbike'
}
export interface Result {
    id: string;
    image_type: string;
    license_plate: string;
    fileName: string;
    timestamp: string;
    url: string;
    plate_url: string;
    vehicle_type: VehicleType;
}
