// @generated automatically by Diesel CLI.

diesel::table! {
    colleges (id) {
        id -> Uuid,
        name -> Text,
        logo_url -> Text,
        location_lat -> Float8,
        location_lng -> Float8,
        created_at -> Int4,
        removed_at -> Nullable<Int4>,
    }
}

diesel::table! {
    event_drivers (id) {
        id -> Int4,
        phone -> Text,
        id_event -> Uuid,
        obsolete_at -> Nullable<Int4>,
        id_vehicle -> Nullable<Uuid>,
    }
}

diesel::table! {
    events (id) {
        name -> Text,
        bio -> Nullable<Text>,
        image_url -> Nullable<Text>,
        time_start -> Int4,
        time_end -> Int4,
        reservations_start -> Int4,
        reservations_end -> Int4,
        id_location -> Nullable<Uuid>,
        id_org -> Uuid,
        obsolete_at -> Nullable<Int4>,
        published_at -> Nullable<Int4>,
        id -> Uuid,
    }
}

diesel::table! {
    invites (id) {
        id -> Uuid,
        id_org -> Uuid,
        phone -> Nullable<Text>,
        created_at -> Int4,
        revoked_at -> Nullable<Int4>,
        created_by -> Text,
        revoked_by -> Nullable<Text>,
    }
}

diesel::table! {
    locations (id) {
        label -> Text,
        location_lat -> Float8,
        location_lng -> Float8,
        image_url -> Text,
        id -> Uuid,
        id_org -> Uuid,
        obsolete_at -> Nullable<Int4>,
    }
}

diesel::table! {
    media (id) {
        id -> Uuid,
        uploader -> Text,
        id_org -> Nullable<Uuid>,
        media_type -> Text,
        url -> Text,
        created_at -> Int4,
        removed_at -> Nullable<Int4>,
    }
}

diesel::table! {
    members (id) {
        id -> Int4,
        phone -> Text,
        flags -> Int4,
        id_org -> Uuid,
    }
}

diesel::table! {
    orgs (id) {
        label -> Text,
        bio -> Nullable<Text>,
        logo_url -> Nullable<Text>,
        banner_url -> Nullable<Text>,
        id -> Uuid,
        college -> Nullable<Uuid>,
    }
}

diesel::table! {
    points (id) {
        id -> Int4,
        org -> Int4,
        amount -> Int4,
        sender -> Text,
        recipient -> Text,
        timestamp -> Int4,
        request -> Nullable<Int4>,
        description -> Text,
        is_revoked -> Bool,
    }
}

diesel::table! {
    points_assignment (id) {
        id -> Int4,
        org -> Int4,
        request -> Int4,
        assignee -> Text,
        timestamp -> Int4,
        is_cancelled -> Bool,
    }
}

diesel::table! {
    points_request (id) {
        id -> Int4,
        org -> Int4,
        amount -> Int4,
        poster -> Text,
        timestamp -> Int4,
        timestamp_deadline -> Nullable<Int4>,
        description -> Text,
        people -> Int4,
        is_complete -> Bool,
        is_removed -> Bool,
    }
}

diesel::table! {
    reservations (id) {
        made_at -> Int4,
        reserver -> Text,
        passenger_count -> Int4,
        is_cancelled -> Bool,
        is_complete -> Bool,
        complete_at -> Nullable<Int4>,
        cancelled_at -> Nullable<Int4>,
        id_driver -> Nullable<Int4>,
        stops -> Text,
        is_dropoff -> Bool,
        id -> Uuid,
        id_event -> Uuid,
        is_driver_arrived -> Bool,
        driver_arrived_at -> Nullable<Int4>,
        est_pickup -> Int4,
        est_dropoff -> Int4,
        rating -> Nullable<Int4>,
        feedback -> Nullable<Int4>,
        rated_at -> Nullable<Int4>,
        cancel_reason -> Nullable<Int4>,
        cancel_reason_at -> Nullable<Int4>,
    }
}

diesel::table! {
    user_group_memberships (id) {
        id -> Int4,
        id_org -> Uuid,
        id_group -> Uuid,
        phone -> Text,
        created_at -> Int4,
        created_by -> Text,
        removed_at -> Nullable<Int4>,
        removed_by -> Nullable<Text>,
    }
}

diesel::table! {
    user_groups (id) {
        id -> Uuid,
        id_org -> Uuid,
        label -> Text,
        color -> Text,
        created_by -> Text,
        updated_by -> Nullable<Text>,
        created_at -> Int4,
        updated_at -> Nullable<Int4>,
        removed_at -> Nullable<Int4>,
    }
}

diesel::table! {
    users (phone) {
        phone -> Text,
        name -> Text,
        image_url -> Nullable<Text>,
        created_at -> Int4,
        updated_at -> Int4,
        is_opted_in_sms -> Nullable<Bool>,
    }
}

diesel::table! {
    vehicles (id) {
        year -> Int4,
        make -> Text,
        model -> Text,
        color -> Text,
        image_url -> Text,
        license -> Text,
        capacity -> Int4,
        id -> Uuid,
        id_org -> Uuid,
        obsolete_at -> Nullable<Int4>,
        owner -> Nullable<Text>,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    colleges,
    event_drivers,
    events,
    invites,
    locations,
    media,
    members,
    orgs,
    points,
    points_assignment,
    points_request,
    reservations,
    user_group_memberships,
    user_groups,
    users,
    vehicles,
);
