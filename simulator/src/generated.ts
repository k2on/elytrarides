import { GraphQLClient } from 'graphql-request';
// @ts-ignore
import { RequestInit } from 'graphql-request/dist/types.dom';
import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

function fetcher<TData, TVariables extends { [key: string]: any }>(client: GraphQLClient, query: string, variables?: TVariables, requestHeaders?: RequestInit['headers']) {
  return async (): Promise<TData> => client.request({
    document: query,
    variables,
    requestHeaders
  });
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Phone: { input: any; output: any; }
  Uuid: { input: any; output: any; }
};

export type Address = {
  __typename?: 'Address';
  main: Scalars['String']['output'];
  sub: Scalars['String']['output'];
};

export type AuthMutation = {
  __typename?: 'AuthMutation';
  /** Send OTP to phone */
  sendOtp: Scalars['Boolean']['output'];
  /** Verify OTP and return JWT */
  verifyOtp: Scalars['String']['output'];
};


export type AuthMutationSendOtpArgs = {
  phone: Scalars['Phone']['input'];
};


export type AuthMutationVerifyOtpArgs = {
  code: Scalars['String']['input'];
  phone: Scalars['Phone']['input'];
};

export type College = {
  __typename?: 'College';
  createdAt: Scalars['Int']['output'];
  id: Scalars['Uuid']['output'];
  locationLat: Scalars['Float']['output'];
  locationLng: Scalars['Float']['output'];
  logoUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  removedAt?: Maybe<Scalars['Int']['output']>;
};

export type CollegeMutation = {
  __typename?: 'CollegeMutation';
  /** Update a college */
  update: College;
};


export type CollegeMutationUpdateArgs = {
  form: FormCollege;
};

export type CollegeQuery = {
  __typename?: 'CollegeQuery';
  /** List all colleges */
  all: Array<College>;
};

export type Driver = {
  __typename?: 'Driver';
  id: Scalars['Int']['output'];
  idEvent: Scalars['Uuid']['output'];
  idVehicle?: Maybe<Scalars['Uuid']['output']>;
  obsoleteAt?: Maybe<Scalars['Int']['output']>;
  phone: Scalars['Phone']['output'];
  user: User;
  vehicle?: Maybe<Vehicle>;
};

export type DriverMutation = {
  __typename?: 'DriverMutation';
  /** Accept a reservation */
  acceptReservation: DriverStrategyEstimations;
  /** Confirm driver arrival */
  confirmArrival: DriverStrategyEstimations;
  /** Confirm driver dropoff */
  confirmDropoff: DriverStrategyEstimations;
  /** Confirm driver pickup */
  confirmPickup: DriverStrategyEstimations;
  /** Sync driver location and queue with server */
  ping: DriverStrategyEstimations;
};


export type DriverMutationAcceptReservationArgs = {
  idDriver: Scalars['Int']['input'];
  idReservation: Scalars['Uuid']['input'];
};


export type DriverMutationConfirmArrivalArgs = {
  idDriver: Scalars['Int']['input'];
  idEvent: Scalars['Uuid']['input'];
};


export type DriverMutationConfirmDropoffArgs = {
  idDriver: Scalars['Int']['input'];
  idEvent: Scalars['Uuid']['input'];
};


export type DriverMutationConfirmPickupArgs = {
  idDriver: Scalars['Int']['input'];
  idEvent: Scalars['Uuid']['input'];
};


export type DriverMutationPingArgs = {
  idDriver: Scalars['Int']['input'];
  idEvent: Scalars['Uuid']['input'];
  location: FormLatLng;
};

export type DriverStopEstimation = DriverStopEstimationEvent | DriverStopEstimationReservation;

export type DriverStopEstimationEvent = {
  __typename?: 'DriverStopEstimationEvent';
  arrival: Scalars['Int']['output'];
};

export type DriverStopEstimationReservation = {
  __typename?: 'DriverStopEstimationReservation';
  idReservation: Scalars['Uuid']['output'];
  isDropoff: Scalars['Boolean']['output'];
  location: DriverStopLocation;
  order: Scalars['Int']['output'];
  passengers: Scalars['Int']['output'];
  reservation: Reservation;
  secondsArrival: Scalars['Int']['output'];
  secondsPickup: Scalars['Int']['output'];
};

export type DriverStopLocation = {
  __typename?: 'DriverStopLocation';
  address: Address;
  coords: LatLng;
  placeId: Scalars['String']['output'];
};

export type DriverStrategyEstimations = {
  __typename?: 'DriverStrategyEstimations';
  dest?: Maybe<DriverStopEstimation>;
  driver: Driver;
  pickedUp: Array<Scalars['Uuid']['output']>;
  queue: Array<DriverStopEstimation>;
};

export type DriverWithVehicle = {
  __typename?: 'DriverWithVehicle';
  id: Scalars['Int']['output'];
  idEvent: Scalars['Uuid']['output'];
  idVehicle: Scalars['Uuid']['output'];
  obsoleteAt?: Maybe<Scalars['Int']['output']>;
  phone: Scalars['Phone']['output'];
  user: User;
  vehicle: Vehicle;
};

export type Event = {
  __typename?: 'Event';
  avaliableReservation?: Maybe<Reservation>;
  avaliableVehicles: Array<Vehicle>;
  bio?: Maybe<Scalars['String']['output']>;
  drivers: Array<Driver>;
  estimate: ReservationEstimate;
  estimateWithoutLocation: ReservationEstimate;
  id: Scalars['Uuid']['output'];
  idLocation?: Maybe<Scalars['Uuid']['output']>;
  idOrg: Scalars['Uuid']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isDriver: Scalars['Boolean']['output'];
  location?: Maybe<OrgLocation>;
  name: Scalars['String']['output'];
  obsoleteAt?: Maybe<Scalars['Int']['output']>;
  org: Organization;
  pool: Array<Reservation>;
  publishedAt?: Maybe<Scalars['Int']['output']>;
  reservations: Array<Reservation>;
  reservationsEnd: Scalars['Int']['output'];
  reservationsStart: Scalars['Int']['output'];
  strategy: StrategyEstimations;
  timeEnd: Scalars['Int']['output'];
  timeStart: Scalars['Int']['output'];
};


export type EventAvaliableReservationArgs = {
  idDriver: Scalars['Int']['input'];
};


export type EventEstimateArgs = {
  form: FormReservation;
};

export type EventQuery = {
  __typename?: 'EventQuery';
  /** Get an event by id */
  get: Event;
};


export type EventQueryGetArgs = {
  id: Scalars['Uuid']['input'];
};

export type Feedback = {
  __typename?: 'Feedback';
  isDriverNeverArrived: Scalars['Boolean']['output'];
  isEtaAccuracy: Scalars['Boolean']['output'];
  isLongWait: Scalars['Boolean']['output'];
  isPickupSpot: Scalars['Boolean']['output'];
};

export type FormCollege = {
  createdAt: Scalars['Int']['input'];
  id: Scalars['Uuid']['input'];
  locationLat: Scalars['Float']['input'];
  locationLng: Scalars['Float']['input'];
  logoUrl: Scalars['String']['input'];
  name: Scalars['String']['input'];
  removedAt?: InputMaybe<Scalars['Int']['input']>;
};

export type FormEvent = {
  bio?: InputMaybe<Scalars['String']['input']>;
  idLocation?: InputMaybe<Scalars['Uuid']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  obsoleteAt?: InputMaybe<Scalars['Int']['input']>;
  publishedAt?: InputMaybe<Scalars['Int']['input']>;
  reservationsEnd?: InputMaybe<Scalars['Int']['input']>;
  reservationsStart?: InputMaybe<Scalars['Int']['input']>;
  timeEnd?: InputMaybe<Scalars['Int']['input']>;
  timeStart?: InputMaybe<Scalars['Int']['input']>;
};

export type FormEventDriver = {
  idVehicle?: InputMaybe<Scalars['Uuid']['input']>;
  obsoleteAt?: InputMaybe<Scalars['Int']['input']>;
};

export type FormLatLng = {
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
};

export type FormLocation = {
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  locationLat?: InputMaybe<Scalars['Float']['input']>;
  locationLng?: InputMaybe<Scalars['Float']['input']>;
  obsoleteAt?: InputMaybe<Scalars['Int']['input']>;
};

export type FormOrganization = {
  bannerUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  college?: InputMaybe<Scalars['Uuid']['input']>;
  label: Scalars['String']['input'];
  logoUrl?: InputMaybe<Scalars['String']['input']>;
};

export type FormReservation = {
  isDropoff: Scalars['Boolean']['input'];
  passengerCount: Scalars['Int']['input'];
  stops: Array<FormReservationStop>;
};

export type FormReservationStop = {
  address: Scalars['String']['input'];
  location: FormLatLng;
  placeId: Scalars['String']['input'];
};

export type FormUser = {
  name: Scalars['String']['input'];
  profileImage?: InputMaybe<Scalars['Uuid']['input']>;
};

export type FormVehicle = {
  capacity?: InputMaybe<Scalars['Int']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  license?: InputMaybe<Scalars['String']['input']>;
  make?: InputMaybe<Scalars['String']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  obsoleteAt?: InputMaybe<Scalars['Int']['input']>;
  owner?: InputMaybe<Scalars['Phone']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type GeoQuery = {
  __typename?: 'GeoQuery';
  /** Get a locations coordinates from its placeId */
  geocode: GeocodeResult;
  /** Search for a location */
  search: Array<SearchResult>;
};


export type GeoQueryGeocodeArgs = {
  placeId: Scalars['String']['input'];
};


export type GeoQuerySearchArgs = {
  idEvent?: InputMaybe<Scalars['Uuid']['input']>;
  query: Scalars['String']['input'];
};

export type GeocodeResult = {
  __typename?: 'GeocodeResult';
  location: LatLng;
};

export type Invite = {
  __typename?: 'Invite';
  createdAt: Scalars['Int']['output'];
  id: Scalars['Uuid']['output'];
  isValid: Scalars['Boolean']['output'];
  org?: Maybe<Organization>;
  user?: Maybe<User>;
};

export type InviteMutation = {
  __typename?: 'InviteMutation';
  /** Update a users membership */
  accept: Invite;
};


export type InviteMutationAcceptArgs = {
  id: Scalars['Uuid']['input'];
};

export type InviteQuery = {
  __typename?: 'InviteQuery';
  /** Get an invite */
  get: Invite;
};


export type InviteQueryGetArgs = {
  id: Scalars['Uuid']['input'];
};

export type LatLng = {
  __typename?: 'LatLng';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type Membership = {
  __typename?: 'Membership';
  isAdmin: Scalars['Boolean']['output'];
  isDriver: Scalars['Boolean']['output'];
  isMember: Scalars['Boolean']['output'];
  isNewMember: Scalars['Boolean']['output'];
  org: Organization;
  user: User;
};

export type MessageDriverLocation = {
  __typename?: 'MessageDriverLocation';
  id: Scalars['Int']['output'];
  location: LatLng;
};

export type MessageEventEstimations = {
  __typename?: 'MessageEventEstimations';
  strategy: StrategyEstimations;
};

export type MessageMarket = MessageDriverLocation | MessageEventEstimations | MessageReservationEstimation | MessageReservationUpdate;

export type MessageReservationEstimation = {
  __typename?: 'MessageReservationEstimation';
  estimate: ReservationEstimate;
};

export type MessageReservationUpdate = {
  __typename?: 'MessageReservationUpdate';
  reservation: Reservation;
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  auth: AuthMutation;
  colleges: CollegeMutation;
  drivers: DriverMutation;
  invites: InviteMutation;
  orgs: OrgMutation;
  reservations: ReservationMutation;
  users: UserMutation;
};

export type OrgLocation = {
  __typename?: 'OrgLocation';
  id: Scalars['Uuid']['output'];
  imageUrl: Scalars['String']['output'];
  label: Scalars['String']['output'];
  locationLat: Scalars['Float']['output'];
  locationLng: Scalars['Float']['output'];
  org: Organization;
};

export type OrgMutation = {
  __typename?: 'OrgMutation';
  /** Create an invitation to the organization */
  inviteCreate: Invite;
  /** Create an invitation to the organization */
  inviteRevoke: Invite;
  /** Update an organization */
  update: Organization;
  /** Update an event */
  updateEvent: Event;
  /** Update an event driver */
  updateEventDriver: Driver;
  /** Update a location */
  updateLocation: OrgLocation;
  /** Update a users membership */
  updateMembership: Membership;
  /** Update a vehicle */
  updateVehicle: Vehicle;
};


export type OrgMutationInviteCreateArgs = {
  id: Scalars['Uuid']['input'];
  idOrg: Scalars['Uuid']['input'];
};


export type OrgMutationInviteRevokeArgs = {
  id: Scalars['Uuid']['input'];
};


export type OrgMutationUpdateArgs = {
  form: FormOrganization;
  idOrg: Scalars['Uuid']['input'];
};


export type OrgMutationUpdateEventArgs = {
  form: FormEvent;
  idEvent: Scalars['Uuid']['input'];
  idOrg: Scalars['Uuid']['input'];
};


export type OrgMutationUpdateEventDriverArgs = {
  form: FormEventDriver;
  idEvent: Scalars['Uuid']['input'];
  phone: Scalars['Phone']['input'];
};


export type OrgMutationUpdateLocationArgs = {
  form: FormLocation;
  idLocation: Scalars['Uuid']['input'];
  idOrg: Scalars['Uuid']['input'];
};


export type OrgMutationUpdateMembershipArgs = {
  flags: Scalars['Int']['input'];
  idOrg: Scalars['Uuid']['input'];
  phone: Scalars['Phone']['input'];
};


export type OrgMutationUpdateVehicleArgs = {
  form: FormVehicle;
  idOrg: Scalars['Uuid']['input'];
  idVehicle: Scalars['Uuid']['input'];
};

export type OrgQuery = {
  __typename?: 'OrgQuery';
  /** List all organizations */
  all: Array<Organization>;
  /** Get an organization */
  get: Organization;
};


export type OrgQueryGetArgs = {
  id: Scalars['Uuid']['input'];
};

export type Organization = {
  __typename?: 'Organization';
  bannerUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  college?: Maybe<College>;
  events: Array<Event>;
  id: Scalars['Uuid']['output'];
  invites: Array<Invite>;
  label: Scalars['String']['output'];
  locations: Array<OrgLocation>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  memberships: Array<Membership>;
  vehicles: Array<Vehicle>;
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  colleges: CollegeQuery;
  events: EventQuery;
  geo: GeoQuery;
  invites: InviteQuery;
  orgs: OrgQuery;
  reservations: ReservationQuery;
  users: UserQuery;
  vehicles: VehicleQuery;
  /** The minimum api version for the mobile client */
  version: Scalars['Int']['output'];
};

export type Reservation = {
  __typename?: 'Reservation';
  cancelReason?: Maybe<Scalars['Int']['output']>;
  cancelReasonAt?: Maybe<Scalars['Int']['output']>;
  cancelledAt?: Maybe<Scalars['Int']['output']>;
  completeAt?: Maybe<Scalars['Int']['output']>;
  driver?: Maybe<DriverWithVehicle>;
  driverArrivedAt?: Maybe<Scalars['Int']['output']>;
  estDropoff: Scalars['Int']['output'];
  estPickup: Scalars['Int']['output'];
  estimate: ReservationEstimate;
  event: Event;
  feedback?: Maybe<Feedback>;
  id: Scalars['Uuid']['output'];
  idDriver?: Maybe<Scalars['Int']['output']>;
  idEvent: Scalars['Uuid']['output'];
  isCancelled: Scalars['Boolean']['output'];
  isCollected: Scalars['Boolean']['output'];
  isComplete: Scalars['Boolean']['output'];
  isDriverArrived: Scalars['Boolean']['output'];
  isDropoff: Scalars['Boolean']['output'];
  isPickedUp: Scalars['Boolean']['output'];
  madeAt: Scalars['Int']['output'];
  passengerCount: Scalars['Int']['output'];
  ratedAt?: Maybe<Scalars['Int']['output']>;
  rating?: Maybe<Scalars['Int']['output']>;
  reserver: User;
  reserverPhone: Scalars['Phone']['output'];
  stops: Array<ReservationStop>;
};

export type ReservationEstimate = {
  __typename?: 'ReservationEstimate';
  queuePosition: Scalars['Int']['output'];
  timeEstimate: TimeEstimate;
};

export type ReservationMutation = {
  __typename?: 'ReservationMutation';
  /** Cancel a reservation */
  cancel: Reservation;
  /** Give a reason for the cancellation */
  giveCancelReason: Reservation;
  /** Rate a reservation */
  rate: Reservation;
  /** Update a reservation */
  reserve: Reservation;
};


export type ReservationMutationCancelArgs = {
  id: Scalars['Uuid']['input'];
};


export type ReservationMutationGiveCancelReasonArgs = {
  id: Scalars['Uuid']['input'];
  reason: Scalars['Int']['input'];
};


export type ReservationMutationRateArgs = {
  feedback: Scalars['Int']['input'];
  id: Scalars['Uuid']['input'];
  rating: Scalars['Int']['input'];
};


export type ReservationMutationReserveArgs = {
  form: FormReservation;
  id: Scalars['Uuid']['input'];
  idEvent: Scalars['Uuid']['input'];
};

export type ReservationQuery = {
  __typename?: 'ReservationQuery';
  /** Get the current users reservation */
  current?: Maybe<Reservation>;
  /** Get a reservation by id */
  get: Reservation;
};


export type ReservationQueryGetArgs = {
  id: Scalars['Uuid']['input'];
};

export type ReservationStop = {
  __typename?: 'ReservationStop';
  address: Address;
  completeAt?: Maybe<Scalars['Int']['output']>;
  isComplete: Scalars['Boolean']['output'];
  locationLat: Scalars['Float']['output'];
  locationLng: Scalars['Float']['output'];
  placeId: Scalars['String']['output'];
};

export type SearchResult = {
  __typename?: 'SearchResult';
  main: Scalars['String']['output'];
  placeId: Scalars['String']['output'];
  sub: Scalars['String']['output'];
};

export type StrategyEstimations = {
  __typename?: 'StrategyEstimations';
  drivers: Array<DriverStrategyEstimations>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to real time event data */
  event: MessageMarket;
  /** Subscribe to real time reservation data */
  reservation: MessageMarket;
};


export type SubscriptionEventArgs = {
  idEvent: Scalars['Uuid']['input'];
  token: Scalars['String']['input'];
};


export type SubscriptionReservationArgs = {
  id: Scalars['Uuid']['input'];
  token: Scalars['String']['input'];
};

export type TimeEstimate = {
  __typename?: 'TimeEstimate';
  arrival: Scalars['Int']['output'];
  pickup: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  commonStops: Array<SearchResult>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  isOptedInSms?: Maybe<Scalars['Boolean']['output']>;
  memberships: Array<Membership>;
  name: Scalars['String']['output'];
  phone: Scalars['Phone']['output'];
};

export type UserMutation = {
  __typename?: 'UserMutation';
  /** Update the logged in user data */
  deleteAccount: Scalars['Boolean']['output'];
  /** Opt in or out of SMS notifications */
  meSmsOpt: User;
  /** Update the logged in user data */
  meUpdate: User;
};


export type UserMutationMeSmsOptArgs = {
  optIn: Scalars['Boolean']['input'];
};


export type UserMutationMeUpdateArgs = {
  form: FormUser;
};

export type UserQuery = {
  __typename?: 'UserQuery';
  /** List of all users */
  all: Array<User>;
  /** Get the logged in user */
  me: User;
};

export type Vehicle = {
  __typename?: 'Vehicle';
  capacity: Scalars['Int']['output'];
  color: Scalars['String']['output'];
  id: Scalars['Uuid']['output'];
  idOrg: Scalars['Uuid']['output'];
  imageUrl: Scalars['String']['output'];
  license: Scalars['String']['output'];
  make: Scalars['String']['output'];
  model: Scalars['String']['output'];
  obsoleteAt?: Maybe<Scalars['Int']['output']>;
  ownerPhone?: Maybe<Scalars['Phone']['output']>;
  year: Scalars['Int']['output'];
};

export type VehicleQuery = {
  __typename?: 'VehicleQuery';
  /** Get the colors for a model */
  colors: Array<Scalars['String']['output']>;
  /** Get the avaliable makes for a year */
  makes: Array<Scalars['String']['output']>;
  /** Get the avaliable models for a make and year */
  models: Array<Scalars['String']['output']>;
  /** Get the avaliable years for a vehicle */
  years: Array<Scalars['String']['output']>;
};


export type VehicleQueryColorsArgs = {
  make: Scalars['String']['input'];
  model: Scalars['String']['input'];
  year: Scalars['String']['input'];
};


export type VehicleQueryMakesArgs = {
  year: Scalars['String']['input'];
};


export type VehicleQueryModelsArgs = {
  make: Scalars['String']['input'];
  year: Scalars['String']['input'];
};

export type DeleteAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteAccountMutation = { __typename?: 'MutationRoot', users: { __typename?: 'UserMutation', deleteAccount: boolean } };

export type SmsOptMutationVariables = Exact<{
  optIn: Scalars['Boolean']['input'];
}>;


export type SmsOptMutation = { __typename?: 'MutationRoot', users: { __typename?: 'UserMutation', meSmsOpt: { __typename?: 'User', phone: any } } };

export type UpdateAccountMutationVariables = Exact<{
  name: Scalars['String']['input'];
  profileImage?: InputMaybe<Scalars['Uuid']['input']>;
}>;


export type UpdateAccountMutation = { __typename?: 'MutationRoot', users: { __typename?: 'UserMutation', meUpdate: { __typename?: 'User', name: string } } };

export type SendOtpMutationVariables = Exact<{
  phone: Scalars['Phone']['input'];
}>;


export type SendOtpMutation = { __typename?: 'MutationRoot', auth: { __typename?: 'AuthMutation', sendOtp: boolean } };

export type VerifyOtpMutationVariables = Exact<{
  phone: Scalars['Phone']['input'];
  code: Scalars['String']['input'];
}>;


export type VerifyOtpMutation = { __typename?: 'MutationRoot', auth: { __typename?: 'AuthMutation', verifyOtp: string } };

export type AcceptMutationVariables = Exact<{
  idDriver: Scalars['Int']['input'];
  idReservation: Scalars['Uuid']['input'];
}>;


export type AcceptMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', acceptReservation: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type AcceptReservationMutationVariables = Exact<{
  idDriver: Scalars['Int']['input'];
  idReservation: Scalars['Uuid']['input'];
}>;


export type AcceptReservationMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', acceptReservation: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type ConfirmArrivalMutationVariables = Exact<{
  idEvent: Scalars['Uuid']['input'];
  idDriver: Scalars['Int']['input'];
}>;


export type ConfirmArrivalMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', confirmArrival: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type ConfirmPickupMutationVariables = Exact<{
  idEvent: Scalars['Uuid']['input'];
  idDriver: Scalars['Int']['input'];
}>;


export type ConfirmPickupMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', confirmPickup: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type ConfirmDropoffMutationVariables = Exact<{
  idEvent: Scalars['Uuid']['input'];
  idDriver: Scalars['Int']['input'];
}>;


export type ConfirmDropoffMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', confirmDropoff: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type DriverPingMutationVariables = Exact<{
  idEvent: Scalars['Uuid']['input'];
  idDriver: Scalars['Int']['input'];
  location: FormLatLng;
}>;


export type DriverPingMutation = { __typename?: 'MutationRoot', drivers: { __typename?: 'DriverMutation', ping: { __typename?: 'DriverStrategyEstimations', pickedUp: Array<any>, dest?: { __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent', arrival: number } | { __typename: 'DriverStopEstimationReservation', isDropoff: boolean, passengers: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', reserver: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null } } }> } } };

export type UpdateLocationMutationVariables = Exact<{
  idOrg: Scalars['Uuid']['input'];
  idLocation: Scalars['Uuid']['input'];
  form: FormLocation;
}>;


export type UpdateLocationMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', updateLocation: { __typename?: 'OrgLocation', id: any } } };

export type UpdateMembershipMutationVariables = Exact<{
  idOrg: Scalars['Uuid']['input'];
  phone: Scalars['Phone']['input'];
  flags: Scalars['Int']['input'];
}>;


export type UpdateMembershipMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', updateMembership: { __typename?: 'Membership', isMember: boolean, isDriver: boolean, isAdmin: boolean } } };

export type UpdateVehicleMutationVariables = Exact<{
  idOrg: Scalars['Uuid']['input'];
  idVehicle: Scalars['Uuid']['input'];
  form: FormVehicle;
}>;


export type UpdateVehicleMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', updateVehicle: { __typename?: 'Vehicle', id: any } } };

export type UpdateEventMutationVariables = Exact<{
  idOrg: Scalars['Uuid']['input'];
  idEvent: Scalars['Uuid']['input'];
  form: FormEvent;
}>;


export type UpdateEventMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', updateEvent: { __typename?: 'Event', id: any } } };

export type UpdateEventDriverMutationVariables = Exact<{
  phone: Scalars['Phone']['input'];
  idEvent: Scalars['Uuid']['input'];
  form: FormEventDriver;
}>;


export type UpdateEventDriverMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', updateEventDriver: { __typename?: 'Driver', id: number } } };

export type InviteAcceptMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type InviteAcceptMutation = { __typename?: 'MutationRoot', invites: { __typename?: 'InviteMutation', accept: { __typename?: 'Invite', id: any } } };

export type InviteCreateMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
  idOrg: Scalars['Uuid']['input'];
}>;


export type InviteCreateMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', inviteCreate: { __typename?: 'Invite', id: any } } };

export type InviteRevokeMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type InviteRevokeMutation = { __typename?: 'MutationRoot', orgs: { __typename?: 'OrgMutation', inviteRevoke: { __typename?: 'Invite', id: any } } };

export type CancelReservationMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type CancelReservationMutation = { __typename?: 'MutationRoot', reservations: { __typename?: 'ReservationMutation', cancel: { __typename?: 'Reservation', id: any } } };

export type ReservationGiveCancelReasonMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
  reason: Scalars['Int']['input'];
}>;


export type ReservationGiveCancelReasonMutation = { __typename?: 'MutationRoot', reservations: { __typename?: 'ReservationMutation', giveCancelReason: { __typename?: 'Reservation', id: any } } };

export type RateReservationMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
  rating: Scalars['Int']['input'];
  feedback: Scalars['Int']['input'];
}>;


export type RateReservationMutation = { __typename?: 'MutationRoot', reservations: { __typename?: 'ReservationMutation', rate: { __typename?: 'Reservation', id: any } } };

export type ReserveMutationVariables = Exact<{
  id: Scalars['Uuid']['input'];
  idEvent: Scalars['Uuid']['input'];
  form: FormReservation;
}>;


export type ReserveMutation = { __typename?: 'MutationRoot', reservations: { __typename?: 'ReservationMutation', reserve: { __typename?: 'Reservation', id: any, isDropoff: boolean, isCancelled: boolean, isComplete: boolean, isPickedUp: boolean, isDriverArrived: boolean, stops: Array<{ __typename?: 'ReservationStop', locationLat: number, locationLng: number, isComplete: boolean, address: { __typename?: 'Address', main: string, sub: string } }>, event: { __typename?: 'Event', id: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string } | null }, driver?: { __typename?: 'DriverWithVehicle', phone: any, user: { __typename?: 'User', name: string, imageUrl?: string | null }, vehicle: { __typename?: 'Vehicle', color: string, license: string, make: string, model: string, imageUrl: string } } | null, estimate: { __typename?: 'ReservationEstimate', queuePosition: number, timeEstimate: { __typename?: 'TimeEstimate', pickup: number, arrival: number } } } } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'QueryRoot', users: { __typename?: 'UserQuery', me: { __typename?: 'User', phone: any, name: string, imageUrl?: string | null, memberships: Array<{ __typename?: 'Membership', isDriver: boolean, isAdmin: boolean, org: { __typename?: 'Organization', id: any, label: string, bio?: string | null, events: Array<{ __typename?: 'Event', id: any, idOrg: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, location?: { __typename?: 'OrgLocation', label: string, locationLat: number, locationLng: number } | null, drivers: Array<{ __typename?: 'Driver', id: number, phone: any, vehicle?: { __typename?: 'Vehicle', id: any, color: string, make: string, model: string } | null }> }> } }> } } };

export type GetMeAccountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeAccountQuery = { __typename?: 'QueryRoot', users: { __typename?: 'UserQuery', me: { __typename?: 'User', name: string, phone: any, imageUrl?: string | null, isOptedInSms?: boolean | null } } };

export type GetMeMembershipsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeMembershipsQuery = { __typename?: 'QueryRoot', users: { __typename?: 'UserQuery', me: { __typename?: 'User', phone: any, name: string, memberships: Array<{ __typename?: 'Membership', isAdmin: boolean, org: { __typename?: 'Organization', id: any, label: string } }> } } };

export type GetApiVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetApiVersionQuery = { __typename?: 'QueryRoot', version: number };

export type GetAdminEventQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetAdminEventQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', id: any, idOrg: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string, locationLat: number, locationLng: number } | null, reservations: Array<{ __typename?: 'Reservation', id: any, madeAt: number, isDropoff: boolean, isCancelled: boolean, isComplete: boolean, isCollected: boolean, cancelledAt?: number | null, completeAt?: number | null, driverArrivedAt?: number | null, idDriver?: number | null, passengerCount: number, rating?: number | null, ratedAt?: number | null, estPickup: number, estDropoff: number, cancelReason?: number | null, reserver: { __typename?: 'User', phone: any, name: string }, stops: Array<{ __typename?: 'ReservationStop', isComplete: boolean, locationLat: number, locationLng: number, address: { __typename?: 'Address', main: string, sub: string } }>, feedback?: { __typename?: 'Feedback', isLongWait: boolean, isEtaAccuracy: boolean, isPickupSpot: boolean, isDriverNeverArrived: boolean } | null }>, drivers: Array<{ __typename?: 'Driver', id: number, phone: any, user: { __typename?: 'User', name: string, imageUrl?: string | null }, vehicle?: { __typename?: 'Vehicle', id: any, imageUrl: string, make: string, model: string, color: string } | null }>, strategy: { __typename?: 'StrategyEstimations', drivers: Array<{ __typename?: 'DriverStrategyEstimations', driver: { __typename?: 'Driver', id: number }, dest?: { __typename: 'DriverStopEstimationEvent' } | { __typename: 'DriverStopEstimationReservation', idReservation: any, secondsPickup: number, secondsArrival: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string }, coords: { __typename?: 'LatLng', lat: number, lng: number } }, reservation: { __typename?: 'Reservation', passengerCount: number, reserver: { __typename?: 'User', name: string } } } | null, queue: Array<{ __typename: 'DriverStopEstimationEvent' } | { __typename: 'DriverStopEstimationReservation', idReservation: any, secondsPickup: number, secondsArrival: number, location: { __typename?: 'DriverStopLocation', address: { __typename?: 'Address', main: string, sub: string } }, reservation: { __typename?: 'Reservation', passengerCount: number, reserver: { __typename?: 'User', name: string } } }> }> } } } };

export type GetAvaliableReservationQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
  idDriver: Scalars['Int']['input'];
}>;


export type GetAvaliableReservationQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', avaliableReservation?: { __typename?: 'Reservation', id: any, passengerCount: number, isDropoff: boolean, reserver: { __typename?: 'User', name: string }, stops: Array<{ __typename?: 'ReservationStop', locationLat: number, locationLng: number, address: { __typename?: 'Address', main: string, sub: string } }> } | null } } };

export type GetEventForDriverQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetEventForDriverQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', id: any, idOrg: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string, locationLat: number, locationLng: number } | null, drivers: Array<{ __typename?: 'Driver', id: number, phone: any, vehicle?: { __typename?: 'Vehicle', id: any, color: string, make: string, model: string, imageUrl: string } | null }> } } };

export type GetDriversQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetDriversQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', drivers: Array<{ __typename?: 'Driver', id: number, phone: any, idVehicle?: any | null, user: { __typename?: 'User', name: string }, vehicle?: { __typename?: 'Vehicle', id: any, make: string, model: string, color: string, license: string, capacity: number } | null }> } } };

export type GetEventEstimateQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
  form: FormReservation;
}>;


export type GetEventEstimateQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', estimate: { __typename?: 'ReservationEstimate', queuePosition: number, timeEstimate: { __typename?: 'TimeEstimate', pickup: number, arrival: number } } } } };

export type GetEventEstimateWithoutLocationQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetEventEstimateWithoutLocationQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', estimateWithoutLocation: { __typename?: 'ReservationEstimate', queuePosition: number, timeEstimate: { __typename?: 'TimeEstimate', pickup: number, arrival: number } } } } };

export type GetEventQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetEventQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', id: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string } | null } } };

export type GetEventAvaliableVehiclesQueryVariables = Exact<{
  idEvent: Scalars['Uuid']['input'];
}>;


export type GetEventAvaliableVehiclesQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', avaliableVehicles: Array<{ __typename?: 'Vehicle', id: any, color: string, make: string, model: string, year: number, capacity: number, license: string, imageUrl: string, ownerPhone?: any | null }> } } };

export type GetMemberEventQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetMemberEventQuery = { __typename?: 'QueryRoot', events: { __typename?: 'EventQuery', get: { __typename?: 'Event', id: any, idOrg: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, isDriver: boolean, location?: { __typename?: 'OrgLocation', id: any, label: string, locationLat: number, locationLng: number } | null } } };

export type GeocodeQueryVariables = Exact<{
  placeId: Scalars['String']['input'];
}>;


export type GeocodeQuery = { __typename?: 'QueryRoot', geo: { __typename?: 'GeoQuery', geocode: { __typename?: 'GeocodeResult', location: { __typename?: 'LatLng', lat: number, lng: number } } } };

export type GeoSearchQueryVariables = Exact<{
  idEvent?: InputMaybe<Scalars['Uuid']['input']>;
  query: Scalars['String']['input'];
}>;


export type GeoSearchQuery = { __typename?: 'QueryRoot', geo: { __typename?: 'GeoQuery', search: Array<{ __typename?: 'SearchResult', main: string, sub: string, placeId: string }> } };

export type GetOrgEventsQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetOrgEventsQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', get: { __typename?: 'Organization', id: any, label: string, events: Array<{ __typename?: 'Event', id: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', label: string } | null }> } } };

export type GetOrgLocationsQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetOrgLocationsQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', get: { __typename?: 'Organization', locations: Array<{ __typename?: 'OrgLocation', id: any, label: string, locationLat: number, locationLng: number }> } } };

export type GetOrgMembersQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetOrgMembersQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', get: { __typename?: 'Organization', invites: Array<{ __typename?: 'Invite', id: any, createdAt: number }>, memberships: Array<{ __typename?: 'Membership', isAdmin: boolean, isDriver: boolean, user: { __typename?: 'User', name: string, imageUrl?: string | null, phone: any } }> } } };

export type GetOrgQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetOrgQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', get: { __typename?: 'Organization', id: any, label: string, bio?: string | null, locations: Array<{ __typename?: 'OrgLocation', label: string, id: any }>, memberships: Array<{ __typename?: 'Membership', isDriver: boolean, user: { __typename?: 'User', name: string, phone: any } }>, vehicles: Array<{ __typename?: 'Vehicle', id: any, make: string, model: string, color: string, license: string, capacity: number }>, college?: { __typename?: 'College', logoUrl: string, name: string } | null } } };

export type GetOrgVehiclesQueryVariables = Exact<{
  id: Scalars['Uuid']['input'];
}>;


export type GetOrgVehiclesQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', get: { __typename?: 'Organization', vehicles: Array<{ __typename?: 'Vehicle', id: any, color: string, make: string, model: string, year: number, capacity: number, license: string, imageUrl: string, ownerPhone?: any | null }> } } };

export type GetVehicleColorsQueryVariables = Exact<{
  year: Scalars['String']['input'];
  make: Scalars['String']['input'];
  model: Scalars['String']['input'];
}>;


export type GetVehicleColorsQuery = { __typename?: 'QueryRoot', vehicles: { __typename?: 'VehicleQuery', colors: Array<string> } };

export type GetVehicleMakesQueryVariables = Exact<{
  year: Scalars['String']['input'];
}>;


export type GetVehicleMakesQuery = { __typename?: 'QueryRoot', vehicles: { __typename?: 'VehicleQuery', makes: Array<string> } };

export type GetVehicleModelsQueryVariables = Exact<{
  year: Scalars['String']['input'];
  make: Scalars['String']['input'];
}>;


export type GetVehicleModelsQuery = { __typename?: 'QueryRoot', vehicles: { __typename?: 'VehicleQuery', models: Array<string> } };

export type GetVehicleYearsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVehicleYearsQuery = { __typename?: 'QueryRoot', vehicles: { __typename?: 'VehicleQuery', years: Array<string> } };

export type GetCurrentReservationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentReservationQuery = { __typename?: 'QueryRoot', reservations: { __typename?: 'ReservationQuery', current?: { __typename?: 'Reservation', id: any, isDropoff: boolean, isCancelled: boolean, isComplete: boolean, isPickedUp: boolean, isDriverArrived: boolean, stops: Array<{ __typename?: 'ReservationStop', locationLat: number, locationLng: number, isComplete: boolean, address: { __typename?: 'Address', main: string, sub: string } }>, event: { __typename?: 'Event', id: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string } | null }, driver?: { __typename?: 'DriverWithVehicle', phone: any, user: { __typename?: 'User', name: string, imageUrl?: string | null }, vehicle: { __typename?: 'Vehicle', color: string, license: string, make: string, model: string, imageUrl: string } } | null, estimate: { __typename?: 'ReservationEstimate', queuePosition: number, timeEstimate: { __typename?: 'TimeEstimate', pickup: number, arrival: number } } } | null } };

export type GetCollegesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCollegesQuery = { __typename?: 'QueryRoot', colleges: { __typename?: 'CollegeQuery', all: Array<{ __typename?: 'College', id: any, name: string, logoUrl: string, locationLat: number, locationLng: number }> } };

export type GetOrgsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOrgsQuery = { __typename?: 'QueryRoot', orgs: { __typename?: 'OrgQuery', all: Array<{ __typename?: 'Organization', id: any, label: string, bio?: string | null, college?: { __typename?: 'College', id: any, name: string, logoUrl: string } | null, memberships: Array<{ __typename?: 'Membership', isDriver: boolean, user: { __typename?: 'User', name: string, phone: any } }>, events: Array<{ __typename?: 'Event', id: any, timeStart: number, name: string }>, locations: Array<{ __typename?: 'OrgLocation', id: any }>, vehicles: Array<{ __typename?: 'Vehicle', id: any }> }> } };

export type GetMeCommonStopsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeCommonStopsQuery = { __typename?: 'QueryRoot', users: { __typename?: 'UserQuery', me: { __typename?: 'User', commonStops: Array<{ __typename?: 'SearchResult', main: string, sub: string, placeId: string }> } } };

export type SubscribeToEventSubscriptionVariables = Exact<{
  id: Scalars['Uuid']['input'];
  token: Scalars['String']['input'];
}>;


export type SubscribeToEventSubscription = { __typename?: 'Subscription', event: { __typename: 'MessageDriverLocation', id: number, location: { __typename?: 'LatLng', lat: number, lng: number } } | { __typename: 'MessageEventEstimations' } | { __typename: 'MessageReservationEstimation' } | { __typename: 'MessageReservationUpdate' } };

export type SubscribeToReservationSubscriptionVariables = Exact<{
  id: Scalars['Uuid']['input'];
  token: Scalars['String']['input'];
}>;


export type SubscribeToReservationSubscription = { __typename?: 'Subscription', reservation: { __typename: 'MessageDriverLocation', location: { __typename?: 'LatLng', lat: number, lng: number } } | { __typename: 'MessageEventEstimations' } | { __typename: 'MessageReservationEstimation', estimate: { __typename?: 'ReservationEstimate', queuePosition: number, timeEstimate: { __typename?: 'TimeEstimate', pickup: number, arrival: number } } } | { __typename: 'MessageReservationUpdate', reservation: { __typename?: 'Reservation', id: any, isDropoff: boolean, isCancelled: boolean, isComplete: boolean, isPickedUp: boolean, isDriverArrived: boolean, stops: Array<{ __typename?: 'ReservationStop', locationLat: number, locationLng: number, isComplete: boolean, address: { __typename?: 'Address', main: string, sub: string } }>, event: { __typename?: 'Event', id: any, name: string, bio?: string | null, imageUrl?: string | null, timeStart: number, timeEnd: number, reservationsStart: number, publishedAt?: number | null, location?: { __typename?: 'OrgLocation', id: any, label: string } | null }, driver?: { __typename?: 'DriverWithVehicle', phone: any, user: { __typename?: 'User', name: string, imageUrl?: string | null }, vehicle: { __typename?: 'Vehicle', color: string, license: string, make: string, model: string, imageUrl: string } } | null } } };


export const DeleteAccountDocument = `
    mutation DeleteAccount {
  users {
    deleteAccount
  }
}
    `;
export const useDeleteAccountMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<DeleteAccountMutation, TError, DeleteAccountMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<DeleteAccountMutation, TError, DeleteAccountMutationVariables, TContext>(
      ['DeleteAccount'],
      (variables?: DeleteAccountMutationVariables) => fetcher<DeleteAccountMutation, DeleteAccountMutationVariables>(client, DeleteAccountDocument, variables, headers)(),
      options
    );
export const SmsOptDocument = `
    mutation SMSOpt($optIn: Boolean!) {
  users {
    meSmsOpt(optIn: $optIn) {
      phone
    }
  }
}
    `;
export const useSmsOptMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<SmsOptMutation, TError, SmsOptMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<SmsOptMutation, TError, SmsOptMutationVariables, TContext>(
      ['SMSOpt'],
      (variables?: SmsOptMutationVariables) => fetcher<SmsOptMutation, SmsOptMutationVariables>(client, SmsOptDocument, variables, headers)(),
      options
    );
export const UpdateAccountDocument = `
    mutation UpdateAccount($name: String!, $profileImage: Uuid) {
  users {
    meUpdate(form: {name: $name, profileImage: $profileImage}) {
      name
    }
  }
}
    `;
export const useUpdateAccountMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateAccountMutation, TError, UpdateAccountMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateAccountMutation, TError, UpdateAccountMutationVariables, TContext>(
      ['UpdateAccount'],
      (variables?: UpdateAccountMutationVariables) => fetcher<UpdateAccountMutation, UpdateAccountMutationVariables>(client, UpdateAccountDocument, variables, headers)(),
      options
    );
export const SendOtpDocument = `
    mutation SendOtp($phone: Phone!) {
  auth {
    sendOtp(phone: $phone)
  }
}
    `;
export const useSendOtpMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<SendOtpMutation, TError, SendOtpMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<SendOtpMutation, TError, SendOtpMutationVariables, TContext>(
      ['SendOtp'],
      (variables?: SendOtpMutationVariables) => fetcher<SendOtpMutation, SendOtpMutationVariables>(client, SendOtpDocument, variables, headers)(),
      options
    );
export const VerifyOtpDocument = `
    mutation VerifyOTP($phone: Phone!, $code: String!) {
  auth {
    verifyOtp(phone: $phone, code: $code)
  }
}
    `;
export const useVerifyOtpMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<VerifyOtpMutation, TError, VerifyOtpMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<VerifyOtpMutation, TError, VerifyOtpMutationVariables, TContext>(
      ['VerifyOTP'],
      (variables?: VerifyOtpMutationVariables) => fetcher<VerifyOtpMutation, VerifyOtpMutationVariables>(client, VerifyOtpDocument, variables, headers)(),
      options
    );
export const AcceptDocument = `
    mutation Accept($idDriver: Int!, $idReservation: Uuid!) {
  drivers {
    acceptReservation(idDriver: $idDriver, idReservation: $idReservation) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useAcceptMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<AcceptMutation, TError, AcceptMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<AcceptMutation, TError, AcceptMutationVariables, TContext>(
      ['Accept'],
      (variables?: AcceptMutationVariables) => fetcher<AcceptMutation, AcceptMutationVariables>(client, AcceptDocument, variables, headers)(),
      options
    );
export const AcceptReservationDocument = `
    mutation AcceptReservation($idDriver: Int!, $idReservation: Uuid!) {
  drivers {
    acceptReservation(idDriver: $idDriver, idReservation: $idReservation) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useAcceptReservationMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<AcceptReservationMutation, TError, AcceptReservationMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<AcceptReservationMutation, TError, AcceptReservationMutationVariables, TContext>(
      ['AcceptReservation'],
      (variables?: AcceptReservationMutationVariables) => fetcher<AcceptReservationMutation, AcceptReservationMutationVariables>(client, AcceptReservationDocument, variables, headers)(),
      options
    );
export const ConfirmArrivalDocument = `
    mutation ConfirmArrival($idEvent: Uuid!, $idDriver: Int!) {
  drivers {
    confirmArrival(idEvent: $idEvent, idDriver: $idDriver) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useConfirmArrivalMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<ConfirmArrivalMutation, TError, ConfirmArrivalMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<ConfirmArrivalMutation, TError, ConfirmArrivalMutationVariables, TContext>(
      ['ConfirmArrival'],
      (variables?: ConfirmArrivalMutationVariables) => fetcher<ConfirmArrivalMutation, ConfirmArrivalMutationVariables>(client, ConfirmArrivalDocument, variables, headers)(),
      options
    );
export const ConfirmPickupDocument = `
    mutation ConfirmPickup($idEvent: Uuid!, $idDriver: Int!) {
  drivers {
    confirmPickup(idEvent: $idEvent, idDriver: $idDriver) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useConfirmPickupMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<ConfirmPickupMutation, TError, ConfirmPickupMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<ConfirmPickupMutation, TError, ConfirmPickupMutationVariables, TContext>(
      ['ConfirmPickup'],
      (variables?: ConfirmPickupMutationVariables) => fetcher<ConfirmPickupMutation, ConfirmPickupMutationVariables>(client, ConfirmPickupDocument, variables, headers)(),
      options
    );
export const ConfirmDropoffDocument = `
    mutation ConfirmDropoff($idEvent: Uuid!, $idDriver: Int!) {
  drivers {
    confirmDropoff(idEvent: $idEvent, idDriver: $idDriver) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useConfirmDropoffMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<ConfirmDropoffMutation, TError, ConfirmDropoffMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<ConfirmDropoffMutation, TError, ConfirmDropoffMutationVariables, TContext>(
      ['ConfirmDropoff'],
      (variables?: ConfirmDropoffMutationVariables) => fetcher<ConfirmDropoffMutation, ConfirmDropoffMutationVariables>(client, ConfirmDropoffDocument, variables, headers)(),
      options
    );
export const DriverPingDocument = `
    mutation DriverPing($idEvent: Uuid!, $idDriver: Int!, $location: FormLatLng!) {
  drivers {
    ping(idEvent: $idEvent, idDriver: $idDriver, location: $location) {
      pickedUp
      dest {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
      queue {
        __typename
        ... on DriverStopEstimationEvent {
          arrival
        }
        ... on DriverStopEstimationReservation {
          isDropoff
          passengers
          location {
            address {
              main
              sub
            }
            coords {
              lat
              lng
            }
          }
          reservation {
            reserver {
              phone
              name
              imageUrl
            }
          }
        }
      }
    }
  }
}
    `;
export const useDriverPingMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<DriverPingMutation, TError, DriverPingMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<DriverPingMutation, TError, DriverPingMutationVariables, TContext>(
      ['DriverPing'],
      (variables?: DriverPingMutationVariables) => fetcher<DriverPingMutation, DriverPingMutationVariables>(client, DriverPingDocument, variables, headers)(),
      options
    );
export const UpdateLocationDocument = `
    mutation UpdateLocation($idOrg: Uuid!, $idLocation: Uuid!, $form: FormLocation!) {
  orgs {
    updateLocation(idLocation: $idLocation, idOrg: $idOrg, form: $form) {
      id
    }
  }
}
    `;
export const useUpdateLocationMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateLocationMutation, TError, UpdateLocationMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateLocationMutation, TError, UpdateLocationMutationVariables, TContext>(
      ['UpdateLocation'],
      (variables?: UpdateLocationMutationVariables) => fetcher<UpdateLocationMutation, UpdateLocationMutationVariables>(client, UpdateLocationDocument, variables, headers)(),
      options
    );
export const UpdateMembershipDocument = `
    mutation UpdateMembership($idOrg: Uuid!, $phone: Phone!, $flags: Int!) {
  orgs {
    updateMembership(idOrg: $idOrg, phone: $phone, flags: $flags) {
      isMember
      isDriver
      isAdmin
    }
  }
}
    `;
export const useUpdateMembershipMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateMembershipMutation, TError, UpdateMembershipMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateMembershipMutation, TError, UpdateMembershipMutationVariables, TContext>(
      ['UpdateMembership'],
      (variables?: UpdateMembershipMutationVariables) => fetcher<UpdateMembershipMutation, UpdateMembershipMutationVariables>(client, UpdateMembershipDocument, variables, headers)(),
      options
    );
export const UpdateVehicleDocument = `
    mutation UpdateVehicle($idOrg: Uuid!, $idVehicle: Uuid!, $form: FormVehicle!) {
  orgs {
    updateVehicle(idVehicle: $idVehicle, idOrg: $idOrg, form: $form) {
      id
    }
  }
}
    `;
export const useUpdateVehicleMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateVehicleMutation, TError, UpdateVehicleMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateVehicleMutation, TError, UpdateVehicleMutationVariables, TContext>(
      ['UpdateVehicle'],
      (variables?: UpdateVehicleMutationVariables) => fetcher<UpdateVehicleMutation, UpdateVehicleMutationVariables>(client, UpdateVehicleDocument, variables, headers)(),
      options
    );
export const UpdateEventDocument = `
    mutation UpdateEvent($idOrg: Uuid!, $idEvent: Uuid!, $form: FormEvent!) {
  orgs {
    updateEvent(idEvent: $idEvent, idOrg: $idOrg, form: $form) {
      id
    }
  }
}
    `;
export const useUpdateEventMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateEventMutation, TError, UpdateEventMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateEventMutation, TError, UpdateEventMutationVariables, TContext>(
      ['UpdateEvent'],
      (variables?: UpdateEventMutationVariables) => fetcher<UpdateEventMutation, UpdateEventMutationVariables>(client, UpdateEventDocument, variables, headers)(),
      options
    );
export const UpdateEventDriverDocument = `
    mutation UpdateEventDriver($phone: Phone!, $idEvent: Uuid!, $form: FormEventDriver!) {
  orgs {
    updateEventDriver(phone: $phone, idEvent: $idEvent, form: $form) {
      id
    }
  }
}
    `;
export const useUpdateEventDriverMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<UpdateEventDriverMutation, TError, UpdateEventDriverMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<UpdateEventDriverMutation, TError, UpdateEventDriverMutationVariables, TContext>(
      ['UpdateEventDriver'],
      (variables?: UpdateEventDriverMutationVariables) => fetcher<UpdateEventDriverMutation, UpdateEventDriverMutationVariables>(client, UpdateEventDriverDocument, variables, headers)(),
      options
    );
export const InviteAcceptDocument = `
    mutation InviteAccept($id: Uuid!) {
  invites {
    accept(id: $id) {
      id
    }
  }
}
    `;
export const useInviteAcceptMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<InviteAcceptMutation, TError, InviteAcceptMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<InviteAcceptMutation, TError, InviteAcceptMutationVariables, TContext>(
      ['InviteAccept'],
      (variables?: InviteAcceptMutationVariables) => fetcher<InviteAcceptMutation, InviteAcceptMutationVariables>(client, InviteAcceptDocument, variables, headers)(),
      options
    );
export const InviteCreateDocument = `
    mutation InviteCreate($id: Uuid!, $idOrg: Uuid!) {
  orgs {
    inviteCreate(id: $id, idOrg: $idOrg) {
      id
    }
  }
}
    `;
export const useInviteCreateMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<InviteCreateMutation, TError, InviteCreateMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<InviteCreateMutation, TError, InviteCreateMutationVariables, TContext>(
      ['InviteCreate'],
      (variables?: InviteCreateMutationVariables) => fetcher<InviteCreateMutation, InviteCreateMutationVariables>(client, InviteCreateDocument, variables, headers)(),
      options
    );
export const InviteRevokeDocument = `
    mutation InviteRevoke($id: Uuid!) {
  orgs {
    inviteRevoke(id: $id) {
      id
    }
  }
}
    `;
export const useInviteRevokeMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<InviteRevokeMutation, TError, InviteRevokeMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<InviteRevokeMutation, TError, InviteRevokeMutationVariables, TContext>(
      ['InviteRevoke'],
      (variables?: InviteRevokeMutationVariables) => fetcher<InviteRevokeMutation, InviteRevokeMutationVariables>(client, InviteRevokeDocument, variables, headers)(),
      options
    );
export const CancelReservationDocument = `
    mutation CancelReservation($id: Uuid!) {
  reservations {
    cancel(id: $id) {
      id
    }
  }
}
    `;
export const useCancelReservationMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<CancelReservationMutation, TError, CancelReservationMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<CancelReservationMutation, TError, CancelReservationMutationVariables, TContext>(
      ['CancelReservation'],
      (variables?: CancelReservationMutationVariables) => fetcher<CancelReservationMutation, CancelReservationMutationVariables>(client, CancelReservationDocument, variables, headers)(),
      options
    );
export const ReservationGiveCancelReasonDocument = `
    mutation ReservationGiveCancelReason($id: Uuid!, $reason: Int!) {
  reservations {
    giveCancelReason(id: $id, reason: $reason) {
      id
    }
  }
}
    `;
export const useReservationGiveCancelReasonMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<ReservationGiveCancelReasonMutation, TError, ReservationGiveCancelReasonMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<ReservationGiveCancelReasonMutation, TError, ReservationGiveCancelReasonMutationVariables, TContext>(
      ['ReservationGiveCancelReason'],
      (variables?: ReservationGiveCancelReasonMutationVariables) => fetcher<ReservationGiveCancelReasonMutation, ReservationGiveCancelReasonMutationVariables>(client, ReservationGiveCancelReasonDocument, variables, headers)(),
      options
    );
export const RateReservationDocument = `
    mutation RateReservation($id: Uuid!, $rating: Int!, $feedback: Int!) {
  reservations {
    rate(id: $id, rating: $rating, feedback: $feedback) {
      id
    }
  }
}
    `;
export const useRateReservationMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<RateReservationMutation, TError, RateReservationMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<RateReservationMutation, TError, RateReservationMutationVariables, TContext>(
      ['RateReservation'],
      (variables?: RateReservationMutationVariables) => fetcher<RateReservationMutation, RateReservationMutationVariables>(client, RateReservationDocument, variables, headers)(),
      options
    );
export const ReserveDocument = `
    mutation Reserve($id: Uuid!, $idEvent: Uuid!, $form: FormReservation!) {
  reservations {
    reserve(id: $id, idEvent: $idEvent, form: $form) {
      id
      isDropoff
      isCancelled
      isComplete
      isPickedUp
      isDriverArrived
      stops {
        locationLat
        locationLng
        isComplete
        address {
          main
          sub
        }
      }
      event {
        id
        name
        bio
        imageUrl
        timeStart
        timeEnd
        reservationsStart
        publishedAt
        location {
          id
          label
        }
      }
      driver {
        phone
        user {
          name
          imageUrl
        }
        vehicle {
          color
          license
          make
          model
          imageUrl
        }
      }
      estimate {
        timeEstimate {
          pickup
          arrival
        }
        queuePosition
      }
    }
  }
}
    `;
export const useReserveMutation = <
      TError = unknown,
      TContext = unknown
    >(
      client: GraphQLClient,
      options?: UseMutationOptions<ReserveMutation, TError, ReserveMutationVariables, TContext>,
      headers?: RequestInit['headers']
    ) =>
    useMutation<ReserveMutation, TError, ReserveMutationVariables, TContext>(
      ['Reserve'],
      (variables?: ReserveMutationVariables) => fetcher<ReserveMutation, ReserveMutationVariables>(client, ReserveDocument, variables, headers)(),
      options
    );
export const GetMeDocument = `
    query GetMe {
  users {
    me {
      phone
      name
      imageUrl
      memberships {
        isDriver
        isAdmin
        org {
          id
          label
          bio
          events {
            id
            idOrg
            name
            bio
            imageUrl
            timeStart
            timeEnd
            reservationsStart
            location {
              label
              locationLat
              locationLng
            }
            drivers {
              id
              phone
              vehicle {
                id
                color
                make
                model
              }
            }
          }
        }
      }
    }
  }
}
    `;
export const useGetMeQuery = <
      TData = GetMeQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetMeQueryVariables,
      options?: UseQueryOptions<GetMeQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetMeQuery, TError, TData>(
      variables === undefined ? ['GetMe'] : ['GetMe', variables],
      fetcher<GetMeQuery, GetMeQueryVariables>(client, GetMeDocument, variables, headers),
      options
    );
export const GetMeAccountDocument = `
    query GetMeAccount {
  users {
    me {
      name
      phone
      imageUrl
      isOptedInSms
    }
  }
}
    `;
export const useGetMeAccountQuery = <
      TData = GetMeAccountQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetMeAccountQueryVariables,
      options?: UseQueryOptions<GetMeAccountQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetMeAccountQuery, TError, TData>(
      variables === undefined ? ['GetMeAccount'] : ['GetMeAccount', variables],
      fetcher<GetMeAccountQuery, GetMeAccountQueryVariables>(client, GetMeAccountDocument, variables, headers),
      options
    );
export const GetMeMembershipsDocument = `
    query GetMeMemberships {
  users {
    me {
      phone
      name
      memberships {
        isAdmin
        org {
          id
          label
        }
      }
    }
  }
}
    `;
export const useGetMeMembershipsQuery = <
      TData = GetMeMembershipsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetMeMembershipsQueryVariables,
      options?: UseQueryOptions<GetMeMembershipsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetMeMembershipsQuery, TError, TData>(
      variables === undefined ? ['GetMeMemberships'] : ['GetMeMemberships', variables],
      fetcher<GetMeMembershipsQuery, GetMeMembershipsQueryVariables>(client, GetMeMembershipsDocument, variables, headers),
      options
    );
export const GetApiVersionDocument = `
    query GetAPIVersion {
  version
}
    `;
export const useGetApiVersionQuery = <
      TData = GetApiVersionQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetApiVersionQueryVariables,
      options?: UseQueryOptions<GetApiVersionQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetApiVersionQuery, TError, TData>(
      variables === undefined ? ['GetAPIVersion'] : ['GetAPIVersion', variables],
      fetcher<GetApiVersionQuery, GetApiVersionQueryVariables>(client, GetApiVersionDocument, variables, headers),
      options
    );
export const GetAdminEventDocument = `
    query GetAdminEvent($id: Uuid!) {
  events {
    get(id: $id) {
      id
      idOrg
      name
      bio
      imageUrl
      timeStart
      timeEnd
      reservationsStart
      publishedAt
      location {
        id
        label
        locationLat
        locationLng
      }
      reservations {
        id
        madeAt
        isDropoff
        isCancelled
        isComplete
        isCollected
        cancelledAt
        completeAt
        driverArrivedAt
        idDriver
        passengerCount
        reserver {
          phone
          name
        }
        stops {
          isComplete
          locationLat
          locationLng
          address {
            main
            sub
          }
        }
        rating
        feedback {
          isLongWait
          isEtaAccuracy
          isPickupSpot
          isDriverNeverArrived
        }
        ratedAt
        estPickup
        estDropoff
        cancelReason
      }
      drivers {
        id
        phone
        user {
          name
          imageUrl
        }
        vehicle {
          id
          imageUrl
          make
          model
          color
        }
      }
      strategy {
        drivers {
          driver {
            id
          }
          dest {
            __typename
            ... on DriverStopEstimationReservation {
              idReservation
              secondsPickup
              secondsArrival
              location {
                address {
                  main
                  sub
                }
                coords {
                  lat
                  lng
                }
              }
              reservation {
                passengerCount
                reserver {
                  name
                }
              }
            }
          }
          queue {
            __typename
            ... on DriverStopEstimationReservation {
              idReservation
              secondsPickup
              secondsArrival
              location {
                address {
                  main
                  sub
                }
              }
              reservation {
                passengerCount
                reserver {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}
    `;
export const useGetAdminEventQuery = <
      TData = GetAdminEventQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetAdminEventQueryVariables,
      options?: UseQueryOptions<GetAdminEventQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetAdminEventQuery, TError, TData>(
      ['GetAdminEvent', variables],
      fetcher<GetAdminEventQuery, GetAdminEventQueryVariables>(client, GetAdminEventDocument, variables, headers),
      options
    );
export const GetAvaliableReservationDocument = `
    query GetAvaliableReservation($id: Uuid!, $idDriver: Int!) {
  events {
    get(id: $id) {
      avaliableReservation(idDriver: $idDriver) {
        id
        reserver {
          name
        }
        passengerCount
        isDropoff
        stops {
          locationLat
          locationLng
          address {
            main
            sub
          }
        }
      }
    }
  }
}
    `;
export const useGetAvaliableReservationQuery = <
      TData = GetAvaliableReservationQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetAvaliableReservationQueryVariables,
      options?: UseQueryOptions<GetAvaliableReservationQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetAvaliableReservationQuery, TError, TData>(
      ['GetAvaliableReservation', variables],
      fetcher<GetAvaliableReservationQuery, GetAvaliableReservationQueryVariables>(client, GetAvaliableReservationDocument, variables, headers),
      options
    );
export const GetEventForDriverDocument = `
    query GetEventForDriver($id: Uuid!) {
  events {
    get(id: $id) {
      id
      idOrg
      name
      bio
      imageUrl
      timeStart
      timeEnd
      reservationsStart
      publishedAt
      location {
        id
        label
        locationLat
        locationLng
      }
      drivers {
        id
        phone
        vehicle {
          id
          color
          make
          model
          imageUrl
        }
      }
    }
  }
}
    `;
export const useGetEventForDriverQuery = <
      TData = GetEventForDriverQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetEventForDriverQueryVariables,
      options?: UseQueryOptions<GetEventForDriverQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetEventForDriverQuery, TError, TData>(
      ['GetEventForDriver', variables],
      fetcher<GetEventForDriverQuery, GetEventForDriverQueryVariables>(client, GetEventForDriverDocument, variables, headers),
      options
    );
export const GetDriversDocument = `
    query GetDrivers($id: Uuid!) {
  events {
    get(id: $id) {
      drivers {
        id
        phone
        user {
          name
        }
        idVehicle
        vehicle {
          id
          make
          model
          color
          license
          capacity
        }
      }
    }
  }
}
    `;
export const useGetDriversQuery = <
      TData = GetDriversQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetDriversQueryVariables,
      options?: UseQueryOptions<GetDriversQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetDriversQuery, TError, TData>(
      ['GetDrivers', variables],
      fetcher<GetDriversQuery, GetDriversQueryVariables>(client, GetDriversDocument, variables, headers),
      options
    );
export const GetEventEstimateDocument = `
    query GetEventEstimate($id: Uuid!, $form: FormReservation!) {
  events {
    get(id: $id) {
      estimate(form: $form) {
        timeEstimate {
          pickup
          arrival
        }
        queuePosition
      }
    }
  }
}
    `;
export const useGetEventEstimateQuery = <
      TData = GetEventEstimateQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetEventEstimateQueryVariables,
      options?: UseQueryOptions<GetEventEstimateQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetEventEstimateQuery, TError, TData>(
      ['GetEventEstimate', variables],
      fetcher<GetEventEstimateQuery, GetEventEstimateQueryVariables>(client, GetEventEstimateDocument, variables, headers),
      options
    );
export const GetEventEstimateWithoutLocationDocument = `
    query GetEventEstimateWithoutLocation($id: Uuid!) {
  events {
    get(id: $id) {
      estimateWithoutLocation {
        timeEstimate {
          pickup
          arrival
        }
        queuePosition
      }
    }
  }
}
    `;
export const useGetEventEstimateWithoutLocationQuery = <
      TData = GetEventEstimateWithoutLocationQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetEventEstimateWithoutLocationQueryVariables,
      options?: UseQueryOptions<GetEventEstimateWithoutLocationQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetEventEstimateWithoutLocationQuery, TError, TData>(
      ['GetEventEstimateWithoutLocation', variables],
      fetcher<GetEventEstimateWithoutLocationQuery, GetEventEstimateWithoutLocationQueryVariables>(client, GetEventEstimateWithoutLocationDocument, variables, headers),
      options
    );
export const GetEventDocument = `
    query GetEvent($id: Uuid!) {
  events {
    get(id: $id) {
      id
      name
      bio
      imageUrl
      timeStart
      timeEnd
      reservationsStart
      publishedAt
      location {
        id
        label
      }
    }
  }
}
    `;
export const useGetEventQuery = <
      TData = GetEventQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetEventQueryVariables,
      options?: UseQueryOptions<GetEventQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetEventQuery, TError, TData>(
      ['GetEvent', variables],
      fetcher<GetEventQuery, GetEventQueryVariables>(client, GetEventDocument, variables, headers),
      options
    );
export const GetEventAvaliableVehiclesDocument = `
    query GetEventAvaliableVehicles($idEvent: Uuid!) {
  events {
    get(id: $idEvent) {
      avaliableVehicles {
        id
        color
        make
        model
        year
        capacity
        license
        imageUrl
        ownerPhone
      }
    }
  }
}
    `;
export const useGetEventAvaliableVehiclesQuery = <
      TData = GetEventAvaliableVehiclesQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetEventAvaliableVehiclesQueryVariables,
      options?: UseQueryOptions<GetEventAvaliableVehiclesQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetEventAvaliableVehiclesQuery, TError, TData>(
      ['GetEventAvaliableVehicles', variables],
      fetcher<GetEventAvaliableVehiclesQuery, GetEventAvaliableVehiclesQueryVariables>(client, GetEventAvaliableVehiclesDocument, variables, headers),
      options
    );
export const GetMemberEventDocument = `
    query GetMemberEvent($id: Uuid!) {
  events {
    get(id: $id) {
      id
      idOrg
      name
      bio
      imageUrl
      timeStart
      timeEnd
      reservationsStart
      publishedAt
      location {
        id
        label
        locationLat
        locationLng
      }
      isDriver
    }
  }
}
    `;
export const useGetMemberEventQuery = <
      TData = GetMemberEventQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetMemberEventQueryVariables,
      options?: UseQueryOptions<GetMemberEventQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetMemberEventQuery, TError, TData>(
      ['GetMemberEvent', variables],
      fetcher<GetMemberEventQuery, GetMemberEventQueryVariables>(client, GetMemberEventDocument, variables, headers),
      options
    );
export const GeocodeDocument = `
    query Geocode($placeId: String!) {
  geo {
    geocode(placeId: $placeId) {
      location {
        lat
        lng
      }
    }
  }
}
    `;
export const useGeocodeQuery = <
      TData = GeocodeQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GeocodeQueryVariables,
      options?: UseQueryOptions<GeocodeQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GeocodeQuery, TError, TData>(
      ['Geocode', variables],
      fetcher<GeocodeQuery, GeocodeQueryVariables>(client, GeocodeDocument, variables, headers),
      options
    );
export const GeoSearchDocument = `
    query GeoSearch($idEvent: Uuid, $query: String!) {
  geo {
    search(idEvent: $idEvent, query: $query) {
      main
      sub
      placeId
    }
  }
}
    `;
export const useGeoSearchQuery = <
      TData = GeoSearchQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GeoSearchQueryVariables,
      options?: UseQueryOptions<GeoSearchQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GeoSearchQuery, TError, TData>(
      ['GeoSearch', variables],
      fetcher<GeoSearchQuery, GeoSearchQueryVariables>(client, GeoSearchDocument, variables, headers),
      options
    );
export const GetOrgEventsDocument = `
    query GetOrgEvents($id: Uuid!) {
  orgs {
    get(id: $id) {
      id
      label
      events {
        id
        name
        bio
        imageUrl
        timeStart
        timeEnd
        publishedAt
        location {
          label
        }
      }
    }
  }
}
    `;
export const useGetOrgEventsQuery = <
      TData = GetOrgEventsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetOrgEventsQueryVariables,
      options?: UseQueryOptions<GetOrgEventsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgEventsQuery, TError, TData>(
      ['GetOrgEvents', variables],
      fetcher<GetOrgEventsQuery, GetOrgEventsQueryVariables>(client, GetOrgEventsDocument, variables, headers),
      options
    );
export const GetOrgLocationsDocument = `
    query GetOrgLocations($id: Uuid!) {
  orgs {
    get(id: $id) {
      locations {
        id
        label
        locationLat
        locationLng
      }
    }
  }
}
    `;
export const useGetOrgLocationsQuery = <
      TData = GetOrgLocationsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetOrgLocationsQueryVariables,
      options?: UseQueryOptions<GetOrgLocationsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgLocationsQuery, TError, TData>(
      ['GetOrgLocations', variables],
      fetcher<GetOrgLocationsQuery, GetOrgLocationsQueryVariables>(client, GetOrgLocationsDocument, variables, headers),
      options
    );
export const GetOrgMembersDocument = `
    query GetOrgMembers($id: Uuid!) {
  orgs {
    get(id: $id) {
      invites {
        id
        createdAt
      }
      memberships {
        user {
          name
          imageUrl
          phone
        }
        isAdmin
        isDriver
      }
    }
  }
}
    `;
export const useGetOrgMembersQuery = <
      TData = GetOrgMembersQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetOrgMembersQueryVariables,
      options?: UseQueryOptions<GetOrgMembersQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgMembersQuery, TError, TData>(
      ['GetOrgMembers', variables],
      fetcher<GetOrgMembersQuery, GetOrgMembersQueryVariables>(client, GetOrgMembersDocument, variables, headers),
      options
    );
export const GetOrgDocument = `
    query GetOrg($id: Uuid!) {
  orgs {
    get(id: $id) {
      id
      label
      bio
      locations {
        label
        id
      }
      memberships {
        user {
          name
          phone
        }
        isDriver
      }
      vehicles {
        id
        make
        model
        color
        license
        capacity
      }
      college {
        logoUrl
        name
      }
    }
  }
}
    `;
export const useGetOrgQuery = <
      TData = GetOrgQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetOrgQueryVariables,
      options?: UseQueryOptions<GetOrgQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgQuery, TError, TData>(
      ['GetOrg', variables],
      fetcher<GetOrgQuery, GetOrgQueryVariables>(client, GetOrgDocument, variables, headers),
      options
    );
export const GetOrgVehiclesDocument = `
    query GetOrgVehicles($id: Uuid!) {
  orgs {
    get(id: $id) {
      vehicles {
        id
        color
        make
        model
        year
        capacity
        license
        imageUrl
        ownerPhone
      }
    }
  }
}
    `;
export const useGetOrgVehiclesQuery = <
      TData = GetOrgVehiclesQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetOrgVehiclesQueryVariables,
      options?: UseQueryOptions<GetOrgVehiclesQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgVehiclesQuery, TError, TData>(
      ['GetOrgVehicles', variables],
      fetcher<GetOrgVehiclesQuery, GetOrgVehiclesQueryVariables>(client, GetOrgVehiclesDocument, variables, headers),
      options
    );
export const GetVehicleColorsDocument = `
    query GetVehicleColors($year: String!, $make: String!, $model: String!) {
  vehicles {
    colors(year: $year, make: $make, model: $model)
  }
}
    `;
export const useGetVehicleColorsQuery = <
      TData = GetVehicleColorsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetVehicleColorsQueryVariables,
      options?: UseQueryOptions<GetVehicleColorsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetVehicleColorsQuery, TError, TData>(
      ['GetVehicleColors', variables],
      fetcher<GetVehicleColorsQuery, GetVehicleColorsQueryVariables>(client, GetVehicleColorsDocument, variables, headers),
      options
    );
export const GetVehicleMakesDocument = `
    query GetVehicleMakes($year: String!) {
  vehicles {
    makes(year: $year)
  }
}
    `;
export const useGetVehicleMakesQuery = <
      TData = GetVehicleMakesQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetVehicleMakesQueryVariables,
      options?: UseQueryOptions<GetVehicleMakesQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetVehicleMakesQuery, TError, TData>(
      ['GetVehicleMakes', variables],
      fetcher<GetVehicleMakesQuery, GetVehicleMakesQueryVariables>(client, GetVehicleMakesDocument, variables, headers),
      options
    );
export const GetVehicleModelsDocument = `
    query GetVehicleModels($year: String!, $make: String!) {
  vehicles {
    models(year: $year, make: $make)
  }
}
    `;
export const useGetVehicleModelsQuery = <
      TData = GetVehicleModelsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables: GetVehicleModelsQueryVariables,
      options?: UseQueryOptions<GetVehicleModelsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetVehicleModelsQuery, TError, TData>(
      ['GetVehicleModels', variables],
      fetcher<GetVehicleModelsQuery, GetVehicleModelsQueryVariables>(client, GetVehicleModelsDocument, variables, headers),
      options
    );
export const GetVehicleYearsDocument = `
    query GetVehicleYears {
  vehicles {
    years
  }
}
    `;
export const useGetVehicleYearsQuery = <
      TData = GetVehicleYearsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetVehicleYearsQueryVariables,
      options?: UseQueryOptions<GetVehicleYearsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetVehicleYearsQuery, TError, TData>(
      variables === undefined ? ['GetVehicleYears'] : ['GetVehicleYears', variables],
      fetcher<GetVehicleYearsQuery, GetVehicleYearsQueryVariables>(client, GetVehicleYearsDocument, variables, headers),
      options
    );
export const GetCurrentReservationDocument = `
    query GetCurrentReservation {
  reservations {
    current {
      id
      isDropoff
      isCancelled
      isComplete
      isPickedUp
      isDriverArrived
      stops {
        locationLat
        locationLng
        isComplete
        address {
          main
          sub
        }
      }
      event {
        id
        name
        bio
        imageUrl
        timeStart
        timeEnd
        reservationsStart
        publishedAt
        location {
          id
          label
        }
      }
      driver {
        phone
        user {
          name
          imageUrl
        }
        vehicle {
          color
          license
          make
          model
          imageUrl
        }
      }
      estimate {
        timeEstimate {
          pickup
          arrival
        }
        queuePosition
      }
    }
  }
}
    `;
export const useGetCurrentReservationQuery = <
      TData = GetCurrentReservationQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetCurrentReservationQueryVariables,
      options?: UseQueryOptions<GetCurrentReservationQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetCurrentReservationQuery, TError, TData>(
      variables === undefined ? ['GetCurrentReservation'] : ['GetCurrentReservation', variables],
      fetcher<GetCurrentReservationQuery, GetCurrentReservationQueryVariables>(client, GetCurrentReservationDocument, variables, headers),
      options
    );
export const GetCollegesDocument = `
    query GetColleges {
  colleges {
    all {
      id
      name
      logoUrl
      locationLat
      locationLng
    }
  }
}
    `;
export const useGetCollegesQuery = <
      TData = GetCollegesQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetCollegesQueryVariables,
      options?: UseQueryOptions<GetCollegesQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetCollegesQuery, TError, TData>(
      variables === undefined ? ['GetColleges'] : ['GetColleges', variables],
      fetcher<GetCollegesQuery, GetCollegesQueryVariables>(client, GetCollegesDocument, variables, headers),
      options
    );
export const GetOrgsDocument = `
    query GetOrgs {
  orgs {
    all {
      id
      label
      bio
      college {
        id
        name
        logoUrl
      }
      memberships {
        user {
          name
          phone
        }
        isDriver
      }
      events {
        id
        timeStart
        name
      }
      locations {
        id
      }
      vehicles {
        id
      }
    }
  }
}
    `;
export const useGetOrgsQuery = <
      TData = GetOrgsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetOrgsQueryVariables,
      options?: UseQueryOptions<GetOrgsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetOrgsQuery, TError, TData>(
      variables === undefined ? ['GetOrgs'] : ['GetOrgs', variables],
      fetcher<GetOrgsQuery, GetOrgsQueryVariables>(client, GetOrgsDocument, variables, headers),
      options
    );
export const GetMeCommonStopsDocument = `
    query GetMeCommonStops {
  users {
    me {
      commonStops {
        main
        sub
        placeId
      }
    }
  }
}
    `;
export const useGetMeCommonStopsQuery = <
      TData = GetMeCommonStopsQuery,
      TError = unknown
    >(
      client: GraphQLClient,
      variables?: GetMeCommonStopsQueryVariables,
      options?: UseQueryOptions<GetMeCommonStopsQuery, TError, TData>,
      headers?: RequestInit['headers']
    ) =>
    useQuery<GetMeCommonStopsQuery, TError, TData>(
      variables === undefined ? ['GetMeCommonStops'] : ['GetMeCommonStops', variables],
      fetcher<GetMeCommonStopsQuery, GetMeCommonStopsQueryVariables>(client, GetMeCommonStopsDocument, variables, headers),
      options
    );
export const SubscribeToEventDocument = `
    subscription SubscribeToEvent($id: Uuid!, $token: String!) {
  event(idEvent: $id, token: $token) {
    __typename
    ... on MessageDriverLocation {
      id
      location {
        lat
        lng
      }
    }
  }
}
    `;
export const SubscribeToReservationDocument = `
    subscription SubscribeToReservation($id: Uuid!, $token: String!) {
  reservation(id: $id, token: $token) {
    __typename
    ... on MessageReservationEstimation {
      estimate {
        timeEstimate {
          pickup
          arrival
        }
        queuePosition
      }
    }
    ... on MessageDriverLocation {
      location {
        lat
        lng
      }
    }
    ... on MessageReservationUpdate {
      reservation {
        id
        isDropoff
        isCancelled
        isComplete
        isPickedUp
        isDriverArrived
        stops {
          locationLat
          locationLng
          isComplete
          address {
            main
            sub
          }
        }
        event {
          id
          name
          bio
          imageUrl
          timeStart
          timeEnd
          reservationsStart
          publishedAt
          location {
            id
            label
          }
        }
        driver {
          phone
          user {
            name
            imageUrl
          }
          vehicle {
            color
            license
            make
            model
            imageUrl
          }
        }
      }
    }
  }
}
    `;
