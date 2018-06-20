--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

-- COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: course_user_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION course_user_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


	IF (TG_OP = 'DELETE') THEN


		UPDATE "courses" SET "course_user_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "course_users" WHERE "course_id" = OLD."course_id" AND course_user_status_id  != 1) t WHERE "id" = OLD."course_id";


		RETURN OLD;


    ELSIF (TG_OP = 'UPDATE') THEN


		UPDATE "courses" SET "course_user_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "course_users" WHERE "course_id" = OLD."course_id" AND course_user_status_id  != 1) t WHERE "id" = OLD."course_id";


		RETURN OLD;


		RETURN NEW;


	ELSIF (TG_OP = 'INSERT') THEN


		UPDATE "courses" SET "course_user_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "course_users" WHERE "course_id" = NEW."course_id" AND course_user_status_id  != 1) t WHERE "id" = NEW."course_id";


		RETURN NEW;


	END IF;


END;


$$;


--
-- Name: total_withdrawn_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION total_withdrawn_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


	IF (TG_OP = 'DELETE') THEN


		UPDATE "users" SET "total_withdrawn_amount" = total_amount FROM (SELECT SUM(amount) as total_amount FROM "user_cash_withdrawals" WHERE "user_id" = OLD."user_id" AND withdrawal_status_id  = 4) t WHERE "id" = OLD."user_id";


		RETURN OLD;


    ELSIF (TG_OP = 'UPDATE') THEN


		UPDATE "users" SET "total_withdrawn_amount" = total_amount FROM (SELECT SUM(amount) as total_amount FROM "user_cash_withdrawals" WHERE "user_id" = OLD."user_id" AND withdrawal_status_id  = 4) t WHERE "id" = OLD."user_id";


		RETURN OLD;


		RETURN NEW;


	ELSIF (TG_OP = 'INSERT') THEN


		UPDATE "users" SET "total_withdrawn_amount" = total_amount FROM (SELECT SUM(amount) as total_amount FROM "user_cash_withdrawals" WHERE "user_id" = NEW."user_id" AND withdrawal_status_id  = 4) t WHERE "id" = NEW."user_id";


		RETURN NEW;


	END IF;


END;


$$;


--
-- Name: update_course_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION update_course_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


	IF (TG_OP = 'DELETE') THEN


		UPDATE "courses" SET "active_online_course_lesson_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "online_course_lessons" WHERE "course_id" = OLD."course_id" AND is_active = 't' AND is_lesson_ready_to_view = 1 AND is_chapter = 0) t WHERE "id" = OLD."course_id";


		UPDATE "courses" SET "online_course_lesson_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "online_course_lessons" WHERE "course_id" = OLD."course_id") t WHERE "id" = OLD."course_id";


		RETURN OLD;


    ELSIF (TG_OP = 'UPDATE') THEN


		UPDATE "courses" SET "active_online_course_lesson_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "online_course_lessons" WHERE "course_id" = OLD."course_id" AND is_active = 't' AND is_lesson_ready_to_view = 1 AND is_chapter = 0) t WHERE "id" = OLD."course_id";


		RETURN OLD;


		RETURN NEW;


	ELSIF (TG_OP = 'INSERT') THEN


		UPDATE "courses" SET "active_online_course_lesson_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "online_course_lessons" WHERE "course_id" = NEW."course_id" AND is_active = 't' AND is_lesson_ready_to_view = 1 AND is_chapter = 0) t WHERE "id" = NEW."course_id";


		UPDATE "courses" SET "online_course_lesson_count" = total_count FROM (SELECT COUNT(*) as total_count FROM "online_course_lessons" WHERE "course_id" = NEW."course_id") t WHERE "id" = NEW."course_id";


		RETURN NEW;


	END IF;


END;


$$;


--
-- Name: update_course_lesson_display_order(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION update_course_lesson_display_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


BEGIN


	IF (TG_OP = 'INSERT') THEN


		UPDATE "online_course_lessons" SET "display_order" = NEW."id" WHERE "id" = NEW."id";


		RETURN NEW;


	END IF;


END;


$$;


--
-- Name: update_course_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION update_course_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$


	DECLARE


		cnt INTEGER := 0;


		sum_of_rating INTEGER := 0;


		avg_rating INTEGER := 0;


	BEGIN


		IF (TG_OP = 'INSERT') THEN


			SELECT SUM(rating) INTO sum_of_rating FROM course_user_feedbacks WHERE course_id = NEW.course_id;


			SELECT COUNT(*) INTO cnt FROM course_user_feedbacks WHERE course_id = NEW.course_id;


		ELSE


			SELECT SUM(rating) INTO sum_of_rating FROM course_user_feedbacks WHERE course_id = OLD.course_id;


			SELECT COUNT(*) INTO cnt FROM course_user_feedbacks WHERE course_id = OLD.course_id;


		END IF;


		IF cnt IS NULL THEN


			cnt = 0;


		END IF;


		IF sum_of_rating IS NULL THEN


			sum_of_rating = 0;


		END IF;


		IF cnt > 0 THEN


			avg_rating = sum_of_rating / cnt;


		END IF;


		IF (TG_OP = 'INSERT') THEN


			UPDATE courses SET total_rating = sum_of_rating, average_rating = avg_rating, course_user_feedback_count = cnt WHERE id = NEW.course_id;


		ELSE


			UPDATE courses SET total_rating = sum_of_rating, average_rating = avg_rating, course_user_feedback_count = cnt WHERE id = OLD.course_id;


		END IF;


		RETURN NULL;


	END;


$$;


--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE categories (
    id bigint DEFAULT nextval('categories_id_seq'::regclass) NOT NULL,
    class_count bigint DEFAULT (0)::bigint NOT NULL,
    created timestamp without time zone,
    is_offline integer DEFAULT 0 NOT NULL,
    is_online integer DEFAULT 1 NOT NULL,
    modified timestamp without time zone,
    name character varying(255),
    parent_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    description text
);


--
-- Name: categories_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW categories_listing AS
 SELECT c.id, 
    c.created, 
    pc.name AS parent_category_name, 
    c.name AS sub_category_name, 
    c.is_online, 
    c.parent_id, 
    c.is_active, 
    c.description, 
    ( SELECT array_to_json(array_agg(row_to_json(cc.*))) AS array_to_json
           FROM ( SELECT scat.id AS category_id, 
                    scat.created, 
                    scat.name AS sub_category_name, 
                    scat.is_online, 
                    scat.parent_id, 
                    scat.is_active
                   FROM categories scat
                  WHERE (scat.parent_id = c.id)) cc) AS sub_category
   FROM (categories c
   LEFT JOIN categories pc ON ((pc.id = c.parent_id)));


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE cities_id_seq
    START WITH 13
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE cities (
    id bigint DEFAULT nextval('cities_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    country_id bigint,
    state_id bigint,
    latitude character varying(255),
    longitude character varying(255),
    name character varying(255),
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE countries_id_seq
    START WITH 255
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE countries (
    id bigint DEFAULT nextval('countries_id_seq'::regclass) NOT NULL,
    iso2 character(2) DEFAULT NULL::bpchar,
    iso3 character(3) DEFAULT NULL::bpchar,
    name character varying(200) DEFAULT NULL::character varying,
    created timestamp without time zone,
    modified timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE states_id_seq
    START WITH 5265
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: states; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE states (
    id bigint DEFAULT nextval('states_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    country_id bigint,
    name character varying(45),
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: cities_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW cities_listing AS
 SELECT ci.id, 
    (ci.created)::timestamp(0) without time zone AS created, 
    (ci.modified)::timestamp(0) without time zone AS modified, 
    ci.country_id, 
    ci.state_id, 
    ci.latitude, 
    ci.longitude, 
    ci.name, 
    ci.is_active, 
    st.name AS state_name, 
    co.name AS country_name, 
    co.iso2 AS country_iso2
   FROM ((cities ci
   LEFT JOIN states st ON ((st.id = ci.state_id)))
   LEFT JOIN countries co ON ((co.id = ci.country_id)));


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE contacts (
    id bigint DEFAULT nextval('contacts_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    email character varying(255),
    first_name character varying(255),
    ip_id bigint,
    last_name character varying(255),
    message text,
    modified timestamp without time zone,
    subject character varying(255),
    user_id bigint
);


--
-- Name: ips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE ips_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ips; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE ips (
    id bigint DEFAULT nextval('ips_id_seq'::regclass) NOT NULL,
    city_id bigint,
    country_id bigint,
    created timestamp without time zone,
    host character varying(255),
    ip character varying(255),
    latitude character varying(255),
    longitude character varying(255),
    modified timestamp without time zone,
    state_id bigint,
    timezone character varying(255),
    user_agent character varying(255)
);


--
-- Name: contacts_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW contacts_listing AS
 SELECT c.id, 
    c.created, 
    c.first_name, 
    c.last_name, 
    c.email, 
    c.subject, 
    c.message, 
    i.ip
   FROM (contacts c
   LEFT JOIN ips i ON ((i.id = c.ip_id)));


--
-- Name: countries_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW countries_listing AS
 SELECT countries.id, 
    countries.iso2, 
    countries.iso3, 
    countries.name, 
    countries.created, 
    countries.modified, 
    countries.is_active
   FROM countries;


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE coupons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE coupons (
    id bigint DEFAULT nextval('coupons_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    teacher_user_id bigint,
    course_id bigint,
    coupon_code character varying(255),
    max_number_of_time_can_use bigint,
    coupon_user_count bigint DEFAULT (0)::bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: course_favourites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_favourites_id_seq
    START WITH 930
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_favourites; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE course_favourites (
    id bigint DEFAULT nextval('course_favourites_id_seq'::regclass) NOT NULL,
    course_id bigint NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint NOT NULL
);


--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE courses_id_seq
    START WITH 793
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE courses (
    id bigint DEFAULT nextval('courses_id_seq'::regclass) NOT NULL,
    category_id bigint,
    course_favourite_count bigint DEFAULT (0)::bigint NOT NULL,
    course_user_count bigint DEFAULT (0)::bigint NOT NULL,
    course_view_count bigint DEFAULT (0)::bigint NOT NULL,
    created timestamp without time zone,
    description text,
    intro_video_embedded_code character varying(255),
    intro_video_thumb_url character varying(255),
    intro_video_url character varying(255),
    is_suspend integer DEFAULT 0 NOT NULL,
    modified timestamp without time zone,
    parent_category_id bigint,
    price double precision DEFAULT (0)::double precision,
    site_revenue_amount double precision DEFAULT (0)::double precision NOT NULL,
    title character varying(255),
    total_revenue_amount double precision DEFAULT (0)::double precision NOT NULL,
    user_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    course_image character varying(255),
    subtitle text,
    students_will_be_able_to text,
    who_should_take_this_course_and_who_should_not text,
    what_actions_students_have_to_perform_before_begin text,
    instructional_level_id bigint,
    language_id bigint,
    course_user_feedback_count integer DEFAULT 0 NOT NULL,
    total_rating integer DEFAULT 0 NOT NULL,
    average_rating double precision DEFAULT 0 NOT NULL,
    online_course_lesson_count bigint DEFAULT (0)::bigint NOT NULL,
    background_picture_url character varying,
    is_public boolean DEFAULT true NOT NULL,
    image_hash character varying,
    course_status_id bigint DEFAULT 1 NOT NULL,
    active_online_course_lesson_count bigint DEFAULT 0 NOT NULL,
    meta_keywords character varying,
    meta_description character varying,
    is_favourite boolean DEFAULT false NOT NULL,
    promo_video character varying,
    is_featured boolean DEFAULT false,
    mooc_affiliate_course_link text,
    is_promo_video_converting_is_processing smallint DEFAULT (0)::smallint NOT NULL,
    is_promo_video_convert_error smallint DEFAULT (0)::smallint NOT NULL,
    is_from_mooc_affiliate integer DEFAULT 0,
    slug character varying(255)
);


--
-- Name: instructional_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE instructional_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instructional_levels; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE instructional_levels (
    id bigint DEFAULT nextval('instructional_levels_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying,
    course_count bigint DEFAULT 0 NOT NULL,
    is_active smallint DEFAULT 1 NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE users_id_seq
    START WITH 12
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE users (
    id bigint DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
    providertype character varying(255),
    accesstoken character varying(255),
    authmethod character varying(255),
    created timestamp without time zone,
    displayname character varying(255),
    email character varying(255),
    isemailverified integer DEFAULT 0,
    is_agree_terms_conditions integer DEFAULT 1 NOT NULL,
    is_suspend integer DEFAULT 0 NOT NULL,
    lastaccess bigint DEFAULT (0)::bigint NOT NULL,
    last_login_ip_id bigint,
    modified timestamp without time zone,
    password character varying(255),
    random_id character varying(255),
    secret character varying(255),
    token character varying(255),
    user_login_count bigint DEFAULT (0)::bigint NOT NULL,
    sudopay_receiver_account_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    total_spend double precision DEFAULT (0)::double precision NOT NULL,
    total_earned double precision DEFAULT (0)::double precision NOT NULL,
    total_site_revenue_amount double precision DEFAULT (0)::double precision NOT NULL,
    course_count bigint DEFAULT (0)::bigint NOT NULL,
    course_user_count bigint DEFAULT (0)::bigint NOT NULL,
    course_user_feedback_count bigint DEFAULT (0)::bigint NOT NULL,
    username character varying,
    user_image character varying,
    image_hash character varying,
    register_ip_id bigint,
    last_logged_in_time timestamp without time zone,
    designation character varying,
    headline character varying,
    biography text,
    website character varying,
    facebook_profile_link character varying,
    twitter_profile_link character varying,
    google_plus_profile_link character varying,
    linkedin_profile_link character varying,
    youtube_profile_link character varying,
    meta_keywords character varying,
    meta_description character varying,
    available_balance double precision DEFAULT (0)::double precision NOT NULL,
    is_teacher integer DEFAULT 0 NOT NULL,
    is_student integer DEFAULT 1 NOT NULL,
    total_withdrawn_amount double precision DEFAULT (0)::double precision
);


--
-- Name: course_favourites_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW course_favourites_listing AS
 SELECT cf.id, 
    u.id AS user_id, 
    u.displayname, 
    c.id AS course_id, 
    uc.displayname AS teacher_name, 
    c.user_id AS teacher_user_id, 
    c.title AS course_title, 
    c.slug AS course_slug, 
    cf.created, 
    c.price, 
    c.total_rating, 
    c.average_rating, 
    c.course_user_feedback_count, 
    c.course_image, 
    c.category_id, 
    cat.name AS category_name, 
    c.parent_category_id, 
    pcat.name AS parent_category_name, 
    c.subtitle, 
    c.instructional_level_id, 
    il.name AS instructional_level_name, 
    c.image_hash, 
    c.is_from_mooc_affiliate, 
    c.mooc_affiliate_course_link
   FROM ((((((course_favourites cf
   LEFT JOIN courses c ON ((c.id = cf.course_id)))
   LEFT JOIN users uc ON ((uc.id = c.user_id)))
   LEFT JOIN categories cat ON ((cat.id = c.category_id)))
   LEFT JOIN categories pcat ON ((pcat.id = c.parent_category_id)))
   LEFT JOIN instructional_levels il ON ((il.id = c.instructional_level_id)))
   LEFT JOIN users u ON ((u.id = cf.user_id)));


--
-- Name: course_levels_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_levels_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_statuses; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE course_statuses (
    id bigint DEFAULT nextval('course_statuses_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying
);


--
-- Name: course_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_user_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_user_feedbacks_id_seq
    START WITH 4
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_user_feedbacks; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE course_user_feedbacks (
    id bigint DEFAULT nextval('course_user_feedbacks_id_seq'::regclass) NOT NULL,
    course_id bigint NOT NULL,
    course_user_id bigint NOT NULL,
    created timestamp without time zone,
    feedback text,
    modified timestamp without time zone,
    user_id bigint,
    rating integer DEFAULT 0 NOT NULL,
    review_title character varying
);


--
-- Name: course_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_users_id_seq
    START WITH 13
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_users; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE course_users (
    id bigint DEFAULT nextval('course_users_id_seq'::regclass) NOT NULL,
    booked_date timestamp without time zone,
    completed_date timestamp without time zone,
    course_id bigint,
    course_user_status_id bigint NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    paykey character varying(255),
    price double precision DEFAULT (0)::double precision NOT NULL,
    site_commission_amount double precision DEFAULT (0)::double precision NOT NULL,
    user_id bigint,
    viewed_lesson_count bigint DEFAULT (0)::bigint NOT NULL,
    coupon_id bigint,
    paypal_pay_key character varying,
    payment_gateway_id bigint
);


--
-- Name: course_user_feedbacks_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW course_user_feedbacks_listing AS
 SELECT cuf.id, 
    c.id AS course_id, 
    c.title AS course_title, 
    c.slug AS course_slug, 
    cu.id AS course_user_id, 
    cuf.created, 
    cuf.feedback, 
    u.id AS user_id, 
    cuf.rating, 
    cuf.review_title, 
    u.displayname, 
    u.user_image, 
    u.image_hash
   FROM (((course_user_feedbacks cuf
   LEFT JOIN courses c ON ((c.id = cuf.course_id)))
   LEFT JOIN course_users cu ON ((cu.id = cuf.course_user_id)))
   LEFT JOIN users u ON ((u.id = cuf.user_id)));


--
-- Name: course_user_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_user_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_user_statuses; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE course_user_statuses (
    id bigint DEFAULT nextval('course_user_statuses_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying(255),
    slug character varying(255)
);


--
-- Name: online_course_lesson_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE online_course_lesson_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: online_course_lesson_views; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE online_course_lesson_views (
    id bigint DEFAULT nextval('online_course_lesson_views_id_seq'::regclass) NOT NULL,
    course_id bigint,
    created timestamp without time zone,
    modified timestamp without time zone,
    online_course_lesson_id bigint NOT NULL,
    user_id bigint,
    is_completed integer DEFAULT 0 NOT NULL,
    course_user_id bigint
);


--
-- Name: course_users_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW course_users_listing AS
 SELECT cu.id, 
    cu.created, 
    cu.booked_date, 
    cu.course_id, 
    cu.user_id, 
    cu.course_user_status_id, 
    c.title AS course_title, 
    c.slug AS course_slug, 
    cu.price, 
        CASE
            WHEN (cuf.rating > 0) THEN cuf.rating
            ELSE 0
        END AS rating, 
    cu.site_commission_amount, 
    cus.name AS course_user_status, 
    cus.slug AS course_user_status_slug, 
        CASE
            WHEN (( SELECT course_favourites.id
               FROM course_favourites
              WHERE (course_favourites.course_id = c.id)
             OFFSET 0
             LIMIT 1) > 0) THEN 'true'::text
            ELSE 'false'::text
        END AS is_favourite, 
    ( SELECT count(online_course_lesson_views.id) AS count
           FROM online_course_lesson_views
          WHERE (((online_course_lesson_views.course_id = c.id) AND (online_course_lesson_views.user_id = cu.user_id)) AND (online_course_lesson_views.is_completed = 1))) AS completed_lesson_count, 
    c.average_rating, 
    c.price AS course_price, 
    c.user_id AS teacher_user_id, 
    c.total_rating, 
    c.course_user_feedback_count, 
    c.course_image, 
    c.image_hash AS course_image_hash, 
    c.category_id, 
    c.active_online_course_lesson_count, 
    cat.name AS category_name, 
    c.parent_category_id, 
    pcat.name AS parent_category_name, 
    c.subtitle, 
    c.instructional_level_id, 
    c.is_from_mooc_affiliate, 
    c.mooc_affiliate_course_link, 
    il.name AS instructional_level_name, 
    tea.displayname AS teacher_name, 
    lea.displayname AS learner_name, 
    lea.user_image, 
    lea.image_hash AS user_image_hash
   FROM ((((((((course_users cu
   LEFT JOIN courses c ON ((c.id = cu.course_id)))
   LEFT JOIN users tea ON ((tea.id = c.user_id)))
   LEFT JOIN users lea ON ((lea.id = cu.user_id)))
   LEFT JOIN categories cat ON ((cat.id = c.category_id)))
   LEFT JOIN categories pcat ON ((pcat.id = c.parent_category_id)))
   LEFT JOIN instructional_levels il ON ((il.id = c.instructional_level_id)))
   LEFT JOIN course_user_feedbacks cuf ON ((cuf.course_user_id = cu.id)))
   LEFT JOIN course_user_statuses cus ON ((cus.id = cu.course_user_status_id)));


--
-- Name: course_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE course_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE languages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE languages (
    id bigint DEFAULT nextval('languages_id_seq'::regclass) NOT NULL,
    created timestamp without time zone NOT NULL,
    modified timestamp without time zone NOT NULL,
    name character varying(80) NOT NULL,
    iso2 character varying(5) NOT NULL,
    iso3 character varying(5),
    is_active smallint DEFAULT 1 NOT NULL
);


--
-- Name: courses_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW courses_listing AS
 SELECT c.id, 
    c.category_id, 
    c.parent_category_id, 
    c.created, 
    c.title, 
    c.slug, 
    c.description, 
    c.user_id, 
    u.displayname, 
    u.image_hash AS user_image_hash, 
    u.headline, 
    u.designation, 
    parcat.name AS parent_category_name, 
    cat.name AS category_name, 
    c.price, 
    c.total_revenue_amount, 
    c.site_revenue_amount, 
    c.course_view_count, 
    c.course_favourite_count, 
    c.course_user_count, 
    c.course_image, 
    c.is_active, 
    c.subtitle, 
    c.students_will_be_able_to, 
    c.who_should_take_this_course_and_who_should_not, 
    c.what_actions_students_have_to_perform_before_begin, 
    c.instructional_level_id, 
    c.language_id, 
    c.course_user_feedback_count, 
    c.total_rating, 
    c.average_rating, 
    c.online_course_lesson_count, 
    c.image_hash, 
    c.is_public, 
    c.course_status_id, 
    c.active_online_course_lesson_count, 
    c.meta_keywords, 
    c.meta_description, 
    cs.name AS course_status_name, 
    c.is_favourite, 
    c.promo_video, 
    c.is_featured, 
    c.mooc_affiliate_course_link, 
    c.is_from_mooc_affiliate, 
    c.is_promo_video_converting_is_processing, 
    c.is_promo_video_convert_error, 
    il.name AS instructional_level_name, 
    lang.name AS language_name
   FROM ((((((courses c
   LEFT JOIN users u ON ((u.id = c.user_id)))
   LEFT JOIN categories parcat ON ((parcat.id = c.parent_category_id)))
   LEFT JOIN categories cat ON ((cat.id = c.category_id)))
   LEFT JOIN instructional_levels il ON ((il.id = c.instructional_level_id)))
   LEFT JOIN languages lang ON ((lang.id = c.language_id)))
   LEFT JOIN course_statuses cs ON ((cs.id = c.course_status_id)));


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE email_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE email_templates (
    id bigint DEFAULT nextval('email_templates_id_seq'::regclass) NOT NULL,
    content text,
    created timestamp without time zone,
    filename character varying(255),
    from_name character varying(255),
    info character varying(255),
    modified timestamp without time zone,
    name character varying(255),
    reply_to character varying(255),
    subject character varying(255)
);


--
-- Name: existing_email_subscriber_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE existing_email_subscriber_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instructional_levels_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW instructional_levels_listing AS
 SELECT li.id, 
    li.created, 
    li.modified, 
    li.name, 
    li.course_count, 
    li.is_active, 
    ( SELECT count(courses.id) AS count
           FROM courses
          WHERE ((courses.course_status_id = (3)::bigint) AND (courses.instructional_level_id = li.id))) AS active_course_count
   FROM instructional_levels li;


--
-- Name: instructional_levels_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE instructional_levels_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instructional_levels_subscriptions; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE instructional_levels_subscriptions (
    id bigint DEFAULT nextval('instructional_levels_subscriptions_id_seq'::regclass) NOT NULL,
    subscription_id bigint NOT NULL,
    instructional_level_id bigint NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone
);


--
-- Name: ipn_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE ipn_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ipn_logs; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE ipn_logs (
    id bigint DEFAULT nextval('ipn_logs_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    post_variable text,
    ip_id integer,
    course_user_id bigint,
    user_subscription_log_id bigint,
    user_subscription_id bigint,
    payment_gateway_id bigint
);


--
-- Name: ipn_logs_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW ipn_logs_listing AS
 SELECT ipn_logs.id, 
    ipn_logs.created, 
    ipn_logs.modified, 
    ipn_logs.post_variable, 
    ipn_logs.ip_id, 
    ipn_logs.course_user_id, 
    ipn_logs.user_subscription_log_id, 
    ipn_logs.user_subscription_id, 
    ipn_logs.payment_gateway_id
   FROM ipn_logs;


--
-- Name: ips_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW ips_listing AS
 SELECT ip.id, 
    ip.created, 
    ip.modified, 
    ip.ip, 
    ip.host, 
    ip.city_id, 
    ip.state_id, 
    ip.country_id, 
    ip.latitude, 
    ip.longitude, 
    ip.user_agent, 
    ci.name AS city_name, 
    st.name AS state_name, 
    co.name AS country_name, 
    co.iso2 AS country_iso2
   FROM (((ips ip
   LEFT JOIN cities ci ON ((ci.id = ip.city_id)))
   LEFT JOIN states st ON ((st.id = ip.state_id)))
   LEFT JOIN countries co ON ((co.id = ip.country_id)));


--
-- Name: languages_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW languages_listing AS
 SELECT lg.id, 
    lg.created, 
    lg.modified, 
    lg.name, 
    lg.iso2, 
    lg.iso3, 
    lg.is_active, 
    ( SELECT count(courses.id) AS count
           FROM courses
          WHERE ((courses.course_status_id = (3)::bigint) AND (courses.language_id = lg.id))) AS active_course_count
   FROM languages lg;


--
-- Name: money_transfer_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE money_transfer_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: money_transfer_accounts; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE money_transfer_accounts (
    id bigint DEFAULT nextval('money_transfer_accounts_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint,
    account text
);


--
-- Name: oauth_access_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_access_tokens (
    access_token character varying(40) NOT NULL,
    client_id character varying(80),
    user_id character varying(255),
    expires timestamp without time zone,
    scope character varying(2000)
);


--
-- Name: oauth_authorization_codes; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_authorization_codes (
    authorization_code character varying(40) NOT NULL,
    client_id character varying(80),
    user_id character varying(255),
    redirect_uri character varying(2000),
    expires timestamp without time zone,
    scope character varying(2000)
);


--
-- Name: oauth_clients; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_clients (
    client_id character varying(80) NOT NULL,
    client_secret character varying(80),
    redirect_uri character varying(2000),
    grant_types character varying(80),
    scope character varying(100),
    user_id character varying(80)
);


--
-- Name: oauth_jwt; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_jwt (
    client_id character varying(80) NOT NULL,
    subject character varying(80),
    public_key character varying(2000)
);


--
-- Name: oauth_refresh_tokens; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_refresh_tokens (
    refresh_token character varying(40) NOT NULL,
    client_id character varying(80),
    user_id character varying(255),
    expires timestamp without time zone,
    scope character varying(2000)
);


--
-- Name: oauth_scopes; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE oauth_scopes (
    scope text NOT NULL,
    is_default boolean
);


--
-- Name: online_course_lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE online_course_lessons_id_seq
    START WITH 773
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: online_course_lessons; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE online_course_lessons (
    id bigint DEFAULT nextval('online_course_lessons_id_seq'::regclass) NOT NULL,
    course_id bigint,
    created timestamp without time zone,
    description text,
    display_order bigint,
    embed_code character varying(255),
    is_chapter integer NOT NULL,
    is_free integer DEFAULT 0 NOT NULL,
    modified timestamp without time zone,
    name character varying(255),
    online_lesson_type_id bigint,
    thumb_url character varying(255),
    total_viewed_count bigint DEFAULT (0)::bigint NOT NULL,
    url character varying(255),
    user_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    what_will_students_able text,
    title character varying,
    content_type character varying,
    filename character varying,
    article_content text,
    is_preview bigint DEFAULT (0)::bigint,
    duration double precision,
    is_video_converting_is_processing smallint DEFAULT (0)::smallint NOT NULL,
    is_lesson_ready_to_view smallint DEFAULT (1)::smallint NOT NULL
);


--
-- Name: online_course_lessons_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW online_course_lessons_listing AS
 SELECT ocl.id, 
    ocl.created, 
    ocl.name AS lesson_name, 
    ocl.description AS lesson_description, 
    ocl.is_chapter, 
    c.id AS course_id, 
    c.title AS course_title, 
    c.slug AS course_slug, 
    c.price AS course_price, 
    c.user_id AS teacher_user_id, 
    ocl.is_free, 
    ocl.total_viewed_count, 
    ocl.is_active, 
    ocl.what_will_students_able, 
    ocl.title, 
    ocl.content_type, 
    ocl.filename, 
    ocl.online_lesson_type_id, 
    ocl.embed_code, 
    ocl.display_order, 
    ocl.is_preview, 
    ocl.article_content, 
    ocl.is_video_converting_is_processing, 
    ocl.is_lesson_ready_to_view, 
    ocl.duration
   FROM (online_course_lessons ocl
   LEFT JOIN courses c ON ((c.id = ocl.course_id)));


--
-- Name: online_lesson_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE online_lesson_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: online_lesson_types; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE online_lesson_types (
    id bigint DEFAULT nextval('online_lesson_types_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    lesson_count bigint NOT NULL,
    modified timestamp without time zone,
    name character varying(255),
    slug character varying(255)
);


--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE pages (
    id bigint DEFAULT nextval('pages_id_seq'::regclass) NOT NULL,
    created time without time zone,
    modified time without time zone,
    title character varying(255),
    content text,
    slug character varying(255),
    language_id bigint NOT NULL
);


--
-- Name: pages_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW pages_listing AS
 SELECT p.id, 
    p.created, 
    p.modified, 
    p.title, 
    p.content, 
    p.slug, 
    p.language_id, 
    lang.name AS language_name, 
    lang.iso2, 
    lang.iso3
   FROM (pages p
   LEFT JOIN languages lang ON ((lang.id = p.language_id)));


--
-- Name: provider_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE provider_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_users; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE provider_users (
    id bigint DEFAULT nextval('provider_users_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint DEFAULT 0 NOT NULL,
    provider_id bigint DEFAULT 0 NOT NULL,
    access_token character varying(255),
    access_token_secret character varying(255),
    is_connected boolean DEFAULT true NOT NULL,
    profile_picture_url character varying(255),
    foreign_id character varying(255)
);


--
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE providers (
    id bigint DEFAULT nextval('providers_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying(255),
    secret_key character varying(255),
    api_key character varying(255),
    icon_class character varying(255),
    button_class character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    display_order bigint
);


--
-- Name: setting_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE setting_categories_id_seq
    START WITH 4
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: setting_categories; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE setting_categories (
    id bigint DEFAULT nextval('setting_categories_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    parent_id bigint NOT NULL,
    name character varying(655),
    description character varying(655),
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: setting_categories_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW setting_categories_listing AS
 SELECT sc.id, 
    sc.created, 
    sc.parent_id, 
    sc.name, 
    sc.description, 
    sc.display_order
   FROM setting_categories sc;


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE settings (
    id bigint DEFAULT nextval('settings_id_seq'::regclass) NOT NULL,
    name character varying(255),
    value text,
    setting_category_id integer DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    label character varying,
    description text
);


--
-- Name: states_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW states_listing AS
 SELECT st.id, 
    st.created, 
    st.modified, 
    st.name, 
    st.is_active, 
    co.id AS country_id, 
    co.name AS country_name, 
    co.iso2 AS country_iso2
   FROM (states st
   LEFT JOIN countries co ON ((co.id = st.country_id)));


--
-- Name: subscription_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE subscription_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_statuses; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE subscription_statuses (
    id bigint DEFAULT nextval('subscription_statuses_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying(255)
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE subscriptions (
    id bigint DEFAULT nextval('subscriptions_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying(255),
    price double precision DEFAULT (0)::double precision,
    interval_unit character varying(255),
    trial_period_price integer DEFAULT 0 NOT NULL,
    trial_period_days integer DEFAULT 0 NOT NULL,
    interval_period integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    description text
);


--
-- Name: sudopay_payment_gateways_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE sudopay_payment_gateways_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sudopay_payment_gateways; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE sudopay_payment_gateways (
    id bigint DEFAULT nextval('sudopay_payment_gateways_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    sudopay_gateway_name character varying(255),
    sudopay_gateway_details text,
    is_marketplace_supported smallint DEFAULT (0)::smallint,
    sudopay_gateway_id bigint,
    sudopay_payment_group_id bigint,
    form_fields_credit_card text,
    form_fields_manual text,
    form_fields_buyer text,
    thumb_url character varying(255),
    supported_features_actions text,
    supported_features_card_types text,
    supported_features_countries text,
    supported_features_credit_card_types text,
    supported_features_currencies text,
    supported_features_languages text,
    supported_features_services text,
    connect_instruction text,
    name character varying(255)
);


--
-- Name: sudopay_payment_gateways_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE sudopay_payment_gateways_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sudopay_payment_gateways_users; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE sudopay_payment_gateways_users (
    id bigint DEFAULT nextval('sudopay_payment_gateways_users_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint,
    sudopay_payment_gateway_id bigint
);


--
-- Name: sudopay_payment_gateways_users_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW sudopay_payment_gateways_users_listing AS
 SELECT spgu.id, 
    spgu.created, 
    spg.sudopay_gateway_name, 
    u.displayname
   FROM ((sudopay_payment_gateways_users spgu
   LEFT JOIN sudopay_payment_gateways spg ON ((spg.id = spgu.sudopay_payment_gateway_id)))
   LEFT JOIN users u ON ((u.id = spgu.user_id)));


--
-- Name: sudopay_payment_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE sudopay_payment_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sudopay_payment_groups; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE sudopay_payment_groups (
    id bigint DEFAULT nextval('sudopay_payment_groups_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    sudopay_group_id bigint NOT NULL,
    name character varying(255),
    thumb_url character varying(255)
);


--
-- Name: sudopay_transaction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE sudopay_transaction_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sudopay_transaction_logs; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE sudopay_transaction_logs (
    id bigint DEFAULT nextval('sudopay_transaction_logs_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    amount double precision NOT NULL,
    payment_id bigint,
    model character varying(255),
    foreign_id bigint,
    sudopay_pay_key character varying(255),
    merchant_id bigint,
    gateway_id bigint,
    gateway_name character varying(255),
    status character varying(255),
    payment_type character varying(255),
    buyer_id bigint,
    buyer_email character varying(255),
    buyer_address character varying(255)
);


--
-- Name: transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE transaction_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_types; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE transaction_types (
    id bigint DEFAULT nextval('transaction_types_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    is_credit integer DEFAULT 1 NOT NULL,
    message character varying(255),
    modified timestamp without time zone,
    name character varying(255),
    transaction_variables character varying(255),
    admin_message text,
    buyer_message text,
    teacher_message text,
    is_credit_for_buyer smallint DEFAULT (0)::smallint NOT NULL,
    is_credit_for_teacher smallint DEFAULT (1)::smallint NOT NULL,
    is_balance_added_in_wallet smallint DEFAULT (0)::smallint NOT NULL
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE transactions (
    id bigint DEFAULT nextval('transactions_id_seq'::regclass) NOT NULL,
    amount double precision NOT NULL,
    classname character varying(255),
    created timestamp without time zone,
    description character varying(255),
    foreign_id bigint NOT NULL,
    modified timestamp without time zone,
    site_commission_amount double precision,
    transaction_type_id bigint NOT NULL,
    user_id bigint,
    teacher_user_id bigint
);


--
-- Name: transactions_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW transactions_listing AS
 SELECT t.id, 
    t.created, 
    t.description, 
    t.amount, 
    t.site_commission_amount, 
    t.user_id, 
    t.teacher_user_id, 
    tu.displayname AS teacher_displayname, 
    t.classname, 
    t.foreign_id, 
    tt.id AS transaction_type_id, 
    tt.name, 
    tt.transaction_variables, 
    tt.admin_message, 
    tt.buyer_message, 
    tt.teacher_message, 
    u.displayname
   FROM (((transactions t
   LEFT JOIN transaction_types tt ON ((tt.id = t.transaction_type_id)))
   LEFT JOIN users u ON ((u.id = t.user_id)))
   LEFT JOIN users tu ON ((tu.id = t.teacher_user_id)));


--
-- Name: translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_access_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE upload_access_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_service_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE upload_service_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE upload_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upload_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE upload_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_cash_withdrawals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_cash_withdrawals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_cash_withdrawals; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_cash_withdrawals (
    id bigint DEFAULT nextval('user_cash_withdrawals_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint,
    withdrawal_status_id bigint,
    amount double precision DEFAULT (0)::double precision,
    money_transfer_account_id bigint
);


--
-- Name: withdrawal_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE withdrawal_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: withdrawal_statuses; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE withdrawal_statuses (
    id bigint DEFAULT nextval('withdrawal_statuses_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    name character varying(255)
);


--
-- Name: user_cash_withdrawals_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW user_cash_withdrawals_listing AS
 SELECT ucw.id, 
    ucw.created, 
    ucw.user_id, 
    ucw.withdrawal_status_id, 
    ucw.amount, 
    ucw.money_transfer_account_id, 
    ws.name AS withdrawal_status_name, 
    mta.account AS money_transfer_account_name
   FROM ((user_cash_withdrawals ucw
   LEFT JOIN withdrawal_statuses ws ON ((ws.id = ucw.withdrawal_status_id)))
   LEFT JOIN money_transfer_accounts mta ON ((mta.id = ucw.money_transfer_account_id)));


--
-- Name: user_logins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_logins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_logins; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_logins (
    id bigint DEFAULT nextval('user_logins_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    provider_type character varying(255),
    user_agent character varying(255),
    user_id bigint NOT NULL,
    user_login_ip_id bigint
);


--
-- Name: user_logins_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW user_logins_listing AS
 SELECT ul.id, 
    ul.created, 
    ul.modified, 
    ul.user_agent, 
    ul.user_id, 
    u.displayname, 
    i.ip
   FROM ((user_logins ul
   LEFT JOIN users u ON ((u.id = ul.user_id)))
   LEFT JOIN ips i ON ((i.id = ul.user_login_ip_id)));


--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_notifications (
    id bigint DEFAULT nextval('user_notifications_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    is_learner_course_favorite_new_class integer NOT NULL,
    is_learner_course_favorite_new_lesson integer NOT NULL,
    is_learner_subscription_new_course integer NOT NULL,
    is_learner_user_follow_new_class integer NOT NULL,
    is_learner_user_follow_new_course integer NOT NULL,
    is_teacher_course_favorited integer NOT NULL,
    is_teacher_offline_course_booked integer NOT NULL,
    is_teacher_online_course_booked integer NOT NULL,
    is_teacher_user_followed integer NOT NULL,
    modified timestamp without time zone,
    user_id bigint NOT NULL
);


--
-- Name: user_notifications_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW user_notifications_listing AS
 SELECT un.id, 
    un.created, 
    un.is_teacher_course_favorited, 
    un.is_teacher_user_followed, 
    un.is_teacher_online_course_booked, 
    un.is_learner_user_follow_new_course, 
    un.is_learner_course_favorite_new_lesson, 
    u.id AS user_id
   FROM (user_notifications un
   LEFT JOIN users u ON ((u.id = un.user_id)));


--
-- Name: user_subscription_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_subscription_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_subscription_logs; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_subscription_logs (
    id bigint DEFAULT nextval('user_subscription_logs_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint,
    user_subscription_id bigint,
    subscription_id bigint,
    subscription_start_date timestamp without time zone,
    subscription_end_date timestamp without time zone,
    sudopay_payment_id bigint,
    paykey character varying,
    amount double precision DEFAULT (0)::double precision NOT NULL,
    subscription_status_id integer
);


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_subscriptions (
    id bigint DEFAULT nextval('user_subscriptions_id_seq'::regclass) NOT NULL,
    created timestamp without time zone,
    modified timestamp without time zone,
    user_id bigint,
    subscription_id bigint,
    vault_key character varying,
    sudopay_gateway_id bigint,
    buyer_email character varying,
    buyer_address character varying,
    buyer_city character varying,
    buyer_state character varying,
    buyer_country character varying,
    buyer_zip_code character varying,
    buyer_phone character varying,
    subscription_status_id bigint,
    last_payment_attempt timestamp without time zone,
    sudopay_paypal_subscription_id bigint,
    paypal_subscr_id character varying,
    payment_gateway_id bigint,
    subscription_canceled_date timestamp without time zone,
    is_cancel_requested integer DEFAULT 0
);


--
-- Name: COLUMN user_subscriptions.last_payment_attempt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN user_subscriptions.last_payment_attempt IS 'Updating last_payment_attempt if payment failed';


--
-- Name: user_upload_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_upload_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_listing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW users_listing AS
 SELECT u.id AS user_id, 
    u.id, 
    u.displayname, 
    u.email, 
    u.user_login_count, 
    u.lastaccess, 
    i.ip, 
    u.providertype, 
    u.created, 
    u.is_active, 
    u.username, 
    u.user_image, 
    u.image_hash, 
    u.total_earned, 
    u.total_spend, 
    u.total_site_revenue_amount, 
    u.isemailverified, 
    u.designation, 
    u.headline, 
    u.biography, 
    u.website, 
    u.facebook_profile_link, 
    u.twitter_profile_link, 
    u.google_plus_profile_link, 
    u.linkedin_profile_link, 
    u.youtube_profile_link, 
    u.meta_keywords, 
    u.meta_description, 
    u.available_balance, 
    u.total_withdrawn_amount, 
    u.is_teacher, 
    u.is_student, 
    ( SELECT count(cf.id) AS count
           FROM course_favourites cf
          WHERE (cf.user_id = u.id)) AS course_favourites_count, 
    ( SELECT count(cu.id) AS count
           FROM course_users cu
          WHERE ((cu.user_id = u.id) AND (cu.course_user_status_id <> 1))) AS course_user_count, 
    ( SELECT count(courses.id) AS count
           FROM courses
          WHERE ((courses.user_id = u.id) AND (courses.course_status_id = 3))) AS active_course_count, 
    ( SELECT count(courses.id) AS count
           FROM courses
          WHERE ((courses.user_id = u.id) AND (courses.course_status_id <> 3))) AS inactive_course_count, 
    i.ip AS last_login_ip, 
    ri.ip AS register_ip
   FROM ((users u
   LEFT JOIN ips i ON ((i.id = u.last_login_ip_id)))
   LEFT JOIN ips ri ON ((ri.id = u.register_ip_id)));


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('attachments_id_seq', 833, true);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY categories (id, class_count, created, is_offline, is_online, modified, name, parent_id, is_active, description) FROM stdin;
207	0	2013-07-16 16:35:30.618	1	1	\N	Business	\N	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
225	0	2013-07-16 16:38:35.323	1	1	\N	Personal Development	\N	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
229	0	2013-07-16 16:39:11.23	1	1	\N	Personal Transformation	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
227	0	2013-07-16 16:38:55.745	1	1	\N	Productivity	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
228	0	2013-07-16 16:39:03.886	1	1	\N	Leadership	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
226	0	2013-07-16 16:38:47.558	1	1	\N	Personal Finance	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
260	0	2015-11-21 12:22:44.761	0	1	2015-11-21 12:22:44.761	Happiness	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
237	0	2015-11-21 11:53:56.652	0	1	2015-11-21 11:53:56.652	Academics	\N	t	Our education training is designed to help teachers and students leverage new technologies and the latest instructional techniques to increase engagement, be more productive in the classroom, and maximize the potential to learn remotely.
233	0	2015-11-21 11:52:27.276	0	1	2015-11-21 11:52:27.276	Photography	\N	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
235	0	2015-11-21 11:53:15.6	0	1	2015-11-21 11:53:15.6	Teacher Training	\N	t	Interested in using ACEv3 with a student? Whether you’re an educator, a parent, or just someone interested in helping others learn, you’ll find the resources you need here.
201	0	2013-07-16 16:31:05.798	1	1	\N	Development	\N	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
230	0	2013-07-16 16:39:22.089	1	1	\N	Design	\N	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
213	0	2013-07-16 16:36:43.478	1	1	\N	IT & Software	\N	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
219	0	2013-07-16 16:37:44.604	1	1	\N	Office Productivity	\N	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
216	0	2013-07-16 16:37:11.557	1	1	\N	IT Certification	213	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
303	0	2015-11-21 12:56:30.172	0	1	2015-11-21 12:56:30.172	Digital Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
304	0	2015-11-21 12:57:00.547	0	1	2015-11-21 12:57:00.547	Photography Fundamentals	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
270	0	2015-11-21 12:30:17.473	0	1	2015-11-21 12:30:17.473	Web Design	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
271	0	2015-11-21 12:30:45.948	0	1	2015-11-21 12:30:45.948	Graphic Design	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
272	0	2015-11-21 12:31:07.987	0	1	2015-11-21 12:31:07.987	Design Tools	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
273	0	2015-11-21 12:31:43.913	0	1	2015-11-21 12:31:43.913	User Experience	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
274	0	2015-11-21 12:32:02.204	0	1	2015-11-21 12:32:02.204	Game Design	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
281	0	2015-11-21 12:40:02.326	0	1	2015-11-21 12:40:02.326	Digital Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
282	0	2015-11-21 12:40:39.441	0	1	2015-11-21 12:40:39.441	Search Engine Optimization	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
283	0	2015-11-21 12:41:04.91	0	1	2015-11-21 12:41:04.91	Social Media Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
208	0	2013-07-16 16:35:43.805	1	1	\N	Finance	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
211	0	2013-07-16 16:36:12.071	1	1	\N	Entrepreneurship	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
212	0	2013-07-16 16:36:22.447	1	1	\N	Communications	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
209	0	2013-07-16 16:35:52.509	1	1	\N	Managemenet	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
263	0	2015-11-21 12:25:12.447	0	1	2015-11-21 12:25:12.447	Creativity	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
340	0	2015-11-21 13:31:04.812	0	1	2015-11-21 13:31:04.812	Social Science	237	t	Our education training is designed to help teachers and students leverage new technologies and the latest instructional techniques to increase engagement, be more productive in the classroom, and maximize the potential to learn remotely.
341	0	2015-11-21 13:31:53.241	0	1	2015-11-21 13:31:53.241	Math & Science	237	t	Our education training is designed to help teachers and students leverage new technologies and the latest instructional techniques to increase engagement, be more productive in the classroom, and maximize the potential to learn remotely.
342	0	2015-11-21 13:32:18.721	0	1	2015-11-21 13:32:18.721	Humanities	237	t	Our education training is designed to help teachers and students leverage new technologies and the latest instructional techniques to increase engagement, be more productive in the classroom, and maximize the potential to learn remotely.
328	0	2015-11-21 13:12:14.967	0	1	2015-11-21 13:12:14.967	Instructional Design	235	t	Interested in using ACEv3 with a student? Whether you’re an educator, a parent, or just someone interested in helping others learn, you’ll find the resources you need here.
232	0	2015-11-21 11:51:51.186	0	1	2015-11-21 11:51:51.186	Life Style	\N	f	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
356	0	2015-11-21 13:39:17.553	0	1	2015-11-21 13:39:17.553	Grad Entry Exam	239	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
210	0	2013-07-16 16:36:02.806	1	1	\N	Sales	207	f	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
244	0	2015-11-21 12:06:27.697	0	1	2015-11-21 12:06:27.697	Strategy	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
245	0	2015-11-21 12:06:48.876	0	1	2015-11-21 12:06:48.876	Operations	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
246	0	2015-11-21 12:07:54.926	0	1	2015-11-21 12:07:54.926	Project Management	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
247	0	2015-11-21 12:08:25.352	0	1	2015-11-21 12:08:25.352	Business Law	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
248	0	2015-11-21 12:09:07.462	0	1	2015-11-21 12:09:07.462	Data & Analytics	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
249	0	2015-11-21 12:09:35.717	0	1	2015-11-21 12:09:35.717	Home Business	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
250	0	2015-11-21 12:10:33.509	0	1	2015-11-21 12:10:33.509	Human Resourses	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
251	0	2015-11-21 12:11:03.373	0	1	2015-11-21 12:11:03.373	Industry	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
252	0	2015-11-21 12:11:26.896	0	1	2015-11-21 12:11:26.896	Medai	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
253	0	2015-11-21 12:11:49.668	0	1	2015-11-21 12:11:49.668	Real Estate	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
254	0	2015-11-21 12:12:11.957	0	1	2015-11-21 12:12:11.957	Others	207	t	Business Specializations and courses help you hone skills critical to success in the modern workplace, with areas of study including entrepreneurship, business strategy, marketing, finance, and management. Whether you're a small business owner or working in a large international firm, business courses will improve your ability to analyze, understand, and solve business problems.
258	0	2015-11-21 12:21:38.283	0	1	2015-11-21 12:21:38.283	Career Develoopment	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
259	0	2015-11-21 12:22:17.973	0	1	2015-11-21 12:22:17.973	Parenting & Relationships	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
261	0	2015-11-21 12:23:48.756	0	1	2015-11-21 12:23:48.756	Religion & Spirituality	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
262	0	2015-11-21 12:24:22.245	0	1	2015-11-21 12:24:22.245	Personal Brand Building	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
264	0	2015-11-21 12:25:42.937	0	1	2015-11-21 12:25:42.937	Influence	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
265	0	2015-11-21 12:26:20.519	0	1	2015-11-21 12:26:20.519	Self Esteem	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
266	0	2015-11-21 12:26:46.042	0	1	2015-11-21 12:26:46.042	Stress Management	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
267	0	2015-11-21 12:27:33.261	0	1	2015-11-21 12:27:33.261	Memory & Study Skills	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
268	0	2015-11-21 12:28:01.814	0	1	2015-11-21 12:28:01.814	Motivation	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
269	0	2015-11-21 12:29:05.559	0	1	2015-11-21 12:29:05.559	Others	225	t	Personal development Specializations and courses teach strategies and frameworks for personal growth, goal setting, and self improvement. You'll learn to manage personal finances, deliver effective speeches, make ethical decisions, and think more creatively.
236	0	2015-11-21 11:53:32.982	0	1	2015-11-21 11:53:32.982	Music	\N	f	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
332	0	2015-11-21 13:14:30.213	0	1	2015-11-21 13:14:30.213	Instruments	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
333	0	2015-11-21 13:22:34.085	0	1	2015-11-21 13:22:34.085	Production	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
334	0	2015-11-21 13:22:59.348	0	1	2015-11-21 13:22:59.348	Music Fundamentals	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
335	0	2015-11-21 13:23:33.344	0	1	2015-11-21 13:23:33.344	Vocal	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
336	0	2015-11-21 13:24:35.947	0	1	2015-11-21 13:24:35.947	Music Techniques	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
337	0	2015-11-21 13:28:04.342	0	1	2015-11-21 13:28:04.342	Music Software	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
338	0	2015-11-21 13:28:20.699	0	1	2015-11-21 13:28:20.699	Others	236	t	Are you ready to learn how to record music and make an album? Our expert-led audio tutorials show how to record and mix songs, make beats, play and customize software instruments, and use popular music production and sound engineering software like Avid Pro Tools, Logic Pro, Ableton Live, and more.
305	0	2015-11-21 12:57:30.562	0	1	2015-11-21 12:57:30.562	Portraits	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
306	0	2015-11-21 12:58:02.25	0	1	2015-11-21 12:58:02.25	Landscape	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
307	0	2015-11-21 12:58:19.447	0	1	2015-11-21 12:58:19.447	Black & White	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
308	0	2015-11-21 12:58:50.275	0	1	2015-11-21 12:58:50.275	Photography Tools	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
309	0	2015-11-21 12:59:32.361	0	1	2015-11-21 12:59:32.361	Mobile Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
310	0	2015-11-21 12:59:59.033	0	1	2015-11-21 12:59:59.033	Travel Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
311	0	2015-11-21 13:00:36.128	0	1	2015-11-21 13:00:36.128	Commercial Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
312	0	2015-11-21 13:01:16.769	0	1	2015-11-21 13:01:16.769	Wedding Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
313	0	2015-11-21 13:01:52.738	0	1	2015-11-21 13:01:52.738	Wildlife Photography	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
314	0	2015-11-21 13:02:27.536	0	1	2015-11-21 13:02:27.536	Video Design	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
315	0	2015-11-21 13:02:50.271	0	1	2015-11-21 13:02:50.271	Others	233	t	Whether you want to be a photographer or just love taking pictures, learn what you need with our in-depth courses in photography: how to shoot photos that tell a story, choose the right gear, create a photo book, and more. Get tips on photo editing, studio photography, and lighting, too.
329	0	2015-11-21 13:12:50.67	0	1	2015-11-21 13:12:50.67	Educational Development	235	t	Interested in using ACEv3 with a student? Whether you’re an educator, a parent, or just someone interested in helping others learn, you’ll find the resources you need here.
330	0	2015-11-21 13:13:15.634	0	1	2015-11-21 13:13:15.634	Teaching Tools	235	t	Interested in using ACEv3 with a student? Whether you’re an educator, a parent, or just someone interested in helping others learn, you’ll find the resources you need here.
331	0	2015-11-21 13:13:30.859	0	1	2015-11-21 13:13:30.859	Others	235	t	Interested in using ACEv3 with a student? Whether you’re an educator, a parent, or just someone interested in helping others learn, you’ll find the resources you need here.
202	0	2013-07-16 16:34:29.71	1	1	\N	Web Development	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
203	0	2013-07-16 16:34:45.133	1	1	\N	Mobile Apps	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
204	0	2013-07-16 16:34:55.57	1	1	\N	Programming Languages	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
205	0	2013-07-16 16:35:09.758	1	1	\N	Game Development	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
206	0	2013-07-16 16:35:19.493	1	1	\N	Databases	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
240	0	2015-11-21 11:59:09.292	0	1	2015-11-21 11:59:09.292	Software Testing	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
241	0	2015-11-21 11:59:52.746	0	1	2015-11-21 11:59:52.746	Software Engineering	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
242	0	2015-11-21 12:00:12.123	0	1	2015-11-21 12:00:12.123	Development Tools	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
243	0	2015-11-21 12:00:39.947	0	1	2015-11-21 12:00:39.947	E-Commerce	201	t	Learn how to code, create, and build web applications, from the foundations of object-oriented programming in C and C++, to how to write Java. Our developer tutorials can help you learn to develop and create mobile apps, work with PHP and MySQL databases, get started with the statistical processing language R, and much more.
275	0	2015-11-21 12:32:33.241	0	1	2015-11-21 12:32:33.241	Design Thinking	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
276	0	2015-11-21 12:33:07.402	0	1	2015-11-21 12:33:07.402	3D & Animation	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
277	0	2015-11-21 12:34:23.127	0	1	2015-11-21 12:34:23.127	Fashion	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
278	0	2015-11-21 12:35:06.206	0	1	2015-11-21 12:35:06.206	Architectural Design	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
279	0	2015-11-21 12:36:22.557	0	1	2015-11-21 12:36:22.557	Interior Design	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
280	0	2015-11-21 12:36:45.049	0	1	2015-11-21 12:36:45.049	Others	230	t	Whether you want to design a logo, create ebooks, or just learn how to use a Pen tool, our in-depth design tutorials can help. Get to know Illustrator and InDesign, explore typography, and learn the nuances of designing for print.
231	0	2015-11-21 11:50:34.66	0	1	2015-11-21 11:50:34.66	Marketing	\N	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
234	0	2015-11-21 11:52:50.057	0	1	2015-11-21 11:52:50.057	Health & Fitness	\N	f	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
238	0	2015-11-21 11:54:13.114	0	1	2015-11-21 11:54:13.114	Language	\N	f	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
239	0	2015-11-21 11:54:26.111	0	1	2015-11-21 11:54:26.111	Test Prep	\N	f	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
214	0	2013-07-16 16:36:53.494	1	1	\N	Network & Security	213	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
217	0	2013-07-16 16:37:19.369	1	1	\N	Hardware	213	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
215	0	2013-07-16 16:37:03.135	1	1	\N	Operating Systems	213	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
218	0	2013-07-16 16:37:34.947	1	1	\N	Others	213	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
222	0	2013-07-16 16:38:08.76	1	1	\N	Microsoft	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
220	0	2013-07-16 16:37:53.12	1	1	\N	Apple	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
221	0	2013-07-16 16:38:00.963	1	1	\N	Google	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
224	0	2013-07-16 16:38:27.479	1	1	\N	SAP	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
223	0	2013-07-16 16:38:17.089	1	1	\N	Intuit	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
255	0	2015-11-21 12:18:08.617	0	1	2015-11-21 12:18:08.617	Saleforce	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
256	0	2015-11-21 12:18:31	0	1	2015-11-21 12:18:31	Oracle	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
257	0	2015-11-21 12:18:56.945	0	1	2015-11-21 12:18:56.945	Others	219	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
284	0	2015-11-21 12:41:32.742	0	1	2015-11-21 12:41:32.742	Branding	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
285	0	2015-11-21 12:42:09.619	0	1	2015-11-21 12:42:09.619	Marketing Fundamentals	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
286	0	2015-11-21 12:42:40.43	0	1	2015-11-21 12:42:40.43	Analytics & Automation	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
287	0	2015-11-21 12:43:07.895	0	1	2015-11-21 12:43:07.895	Public Relations	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
288	0	2015-11-21 12:43:56.105	0	1	2015-11-21 12:43:56.105	Advertising	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
289	0	2015-11-21 12:44:54.975	0	1	2015-11-21 12:44:54.975	Video & Mobile Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
290	0	2015-11-21 12:45:14.609	0	1	2015-11-21 12:45:14.609	Content Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
291	0	2015-11-21 12:45:54.783	0	1	2015-11-21 12:45:54.783	Non-Digital Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
292	0	2015-11-21 12:46:29.878	0	1	2015-11-21 12:46:29.878	Growth Hacking	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
293	0	2015-11-21 12:47:00.92	0	1	2015-11-21 12:47:00.92	Affiliate Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
294	0	2015-11-21 12:47:25.638	0	1	2015-11-21 12:47:25.638	Product Marketing	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
295	0	2015-11-21 12:47:51.074	0	1	2015-11-21 12:47:51.074	Others	231	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
296	0	2015-11-21 12:48:57.228	0	1	2015-11-21 12:48:57.228	Arts & Crafts	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
297	0	2015-11-21 12:49:22.523	0	1	2015-11-21 12:49:22.523	Food & Beverage	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
298	0	2015-11-21 12:49:56.616	0	1	2015-11-21 12:49:56.616	Beauty & Makeup	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
299	0	2015-11-21 12:53:53.35	0	1	2015-11-21 12:53:53.35	Travel	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
300	0	2015-11-21 12:54:18.917	0	1	2015-11-21 12:54:18.917	Gaming	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
301	0	2015-11-21 12:55:05.316	0	1	2015-11-21 12:55:05.316	Home Improvement	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
302	0	2015-11-21 12:55:40.396	0	1	2015-11-21 12:55:40.396	Pet Care & Training	232	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
316	0	2015-11-21 13:03:41.381	0	1	2015-11-21 13:03:41.381	Fitness	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
317	0	2015-11-21 13:04:05.178	0	1	2015-11-21 13:04:05.178	General Health	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
318	0	2015-11-21 13:04:23.957	0	1	2015-11-21 13:04:23.957	Sports	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
319	0	2015-11-21 13:04:46.75	0	1	2015-11-21 13:04:46.75	Nutrition	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
320	0	2015-11-21 13:05:02.639	0	1	2015-11-21 13:05:02.639	Yoga	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
321	0	2015-11-21 13:05:19.589	0	1	2015-11-21 13:05:19.589	Mental Health	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
357	0	2015-11-21 13:40:07.216	0	1	2015-11-21 13:40:07.216	International High School	239	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
358	0	2015-11-21 13:40:43.85	0	1	2015-11-21 13:40:43.85	College Entry Exam	239	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
359	0	2015-11-21 13:41:19.266	0	1	2015-11-21 13:41:19.266	Test Taking Skills	239	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
360	0	2015-11-21 13:41:41.153	0	1	2015-11-21 13:41:41.153	Others	239	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
322	0	2015-11-21 13:06:25.345	0	1	2015-11-21 13:06:25.345	Dieting	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
323	0	2015-11-21 13:07:08.245	0	1	2015-11-21 13:07:08.245	Self Defence	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
324	0	2015-11-21 13:07:22.321	0	1	2015-11-21 13:07:22.321	Safety & First Aid	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
325	0	2015-11-21 13:07:43.115	0	1	2015-11-21 13:07:43.115	Dance	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
326	0	2015-11-21 13:07:55.879	0	1	2015-11-21 13:07:55.879	Meditaion	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
327	0	2015-11-21 13:10:57.407	0	1	2015-11-21 13:10:57.407	Others	234	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
343	0	2015-11-21 13:33:25.616	0	1	2015-11-21 13:33:25.616	English	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
344	0	2015-11-21 13:33:49.737	0	1	2015-11-21 13:33:49.737	Spanish	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
345	0	2015-11-21 13:34:09.983	0	1	2015-11-21 13:34:09.983	German	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
346	0	2015-11-21 13:34:30.87	0	1	2015-11-21 13:34:30.87	French	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
347	0	2015-11-21 13:35:00.099	0	1	2015-11-21 13:35:00.099	Japanese	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
348	0	2015-11-21 13:35:37.468	0	1	2015-11-21 13:35:37.468	Portuguese	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
349	0	2015-11-21 13:36:00.214	0	1	2015-11-21 13:36:00.214	Chinese	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
350	0	2015-11-21 13:36:29.99	0	1	2015-11-21 13:36:29.99	Russian	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
351	0	2015-11-21 13:36:47.221	0	1	2015-11-21 13:36:47.221	Latin	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
352	0	2015-11-21 13:37:00.625	0	1	2015-11-21 13:37:00.625	Arabic	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
353	0	2015-11-21 13:37:34.072	0	1	2015-11-21 13:37:34.072	Hebrew	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
354	0	2015-11-21 13:37:56.505	0	1	2015-11-21 13:37:56.505	Italian	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
355	0	2015-11-21 13:38:14.736	0	1	2015-11-21 13:38:14.736	Others	238	t	Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sagittis lacinia consequat. Aenean et ipsum id velit tincidunt accumsan id eu odio. Nam eu ullamcorper sapien. Vivamus velit enim, ultrices quis nunc sit amet, fringilla malesuada ex. Aliquam venenatis egestas luctus. Proin aliquet luctus velit, in blandit nisl efficitur vel.
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('categories_id_seq', 360, true);


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY cities (id, created, modified, country_id, state_id, latitude, longitude, name, is_active) FROM stdin;
\.


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('cities_id_seq', 1319, true);


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY contacts (id, created, email, first_name, ip_id, last_name, message, modified, subject, user_id) FROM stdin;
\.


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('contacts_id_seq', 2, true);


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY countries (id, iso2, iso3, name, created, modified, is_active) FROM stdin;
1	AF	AFG	Afghanistan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
2	AX	ALA	Aland Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
4	DZ	DZA	Algeria	2013-02-07 10:11:00	2013-02-07 10:11:00	t
5	AS	ASM	American Samoa	2013-02-07 10:11:00	2013-02-07 10:11:00	t
6	AD	AND	Andorra	2013-02-07 10:11:00	2013-02-07 10:11:00	t
7	AO	AGO	Angola	2013-02-07 10:11:00	2013-02-07 10:11:00	t
8	AI	AIA	Anguilla	2013-02-07 10:11:00	2013-02-07 10:11:00	t
9	AQ	ATA	Antarctica	2013-02-07 10:11:00	2013-02-07 10:11:00	t
10	AG	ATG	Antigua and Barbuda	2013-02-07 10:11:00	2013-02-07 10:11:00	t
11	AR	ARG	Argentina	2013-02-07 10:11:00	2013-02-07 10:11:00	t
12	AM	ARM	Armenia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
13	AW	ABW	Aruba	2013-02-07 10:11:00	2013-02-07 10:11:00	t
14	AU	AUS	Australia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
15	AT	AUT	Austria	2013-02-07 10:11:00	2013-02-07 10:11:00	t
16	AZ	AZE	Azerbaijan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
17	BS	BHS	Bahamas	2013-02-07 10:11:00	2013-02-07 10:11:00	t
18	BH	BHR	Bahrain	2013-02-07 10:11:00	2013-02-07 10:11:00	t
19	BD	BGD	Bangladesh	2013-02-07 10:11:00	2013-02-07 10:11:00	t
20	BB	BRB	Barbados	2013-02-07 10:11:00	2013-02-07 10:11:00	t
21	BY	BLR	Belarus	2013-02-07 10:11:00	2013-02-07 10:11:00	t
22	BE	BEL	Belgium	2013-02-07 10:11:00	2013-02-07 10:11:00	t
23	BZ	BLZ	Belize	2013-02-07 10:11:00	2013-02-07 10:11:00	t
24	BJ	BEN	Benin	2013-02-07 10:11:00	2013-02-07 10:11:00	t
25	BM	BMU	Bermuda	2013-02-07 10:11:00	2013-02-07 10:11:00	t
26	BT	BTN	Bhutan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
27	BO	BOL	Bolivia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
28	BQ	BES	Bonaire, Saint Eustatius and Saba 	2013-02-07 10:11:00	2013-02-07 10:11:00	t
29	BA	BIH	Bosnia and Herzegovina	2013-02-07 10:11:00	2013-02-07 10:11:00	t
30	BW	BWA	Botswana	2013-02-07 10:11:00	2013-02-07 10:11:00	t
31	BV	BVT	Bouvet Island	2013-02-07 10:11:00	2013-02-07 10:11:00	t
32	BR	BRA	Brazil	2013-02-07 10:11:00	2013-02-07 10:11:00	t
33	IO	IOT	British Indian Ocean Territory	2013-02-07 10:11:00	2013-02-07 10:11:00	t
34	VG	VGB	British Virgin Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
35	BN	BRN	Brunei	2013-02-07 10:11:00	2013-02-07 10:11:00	t
36	BG	BGR	Bulgaria	2013-02-07 10:11:00	2013-02-07 10:11:00	t
37	BF	BFA	Burkina Faso	2013-02-07 10:11:00	2013-02-07 10:11:00	t
38	BI	BDI	Burundi	2013-02-07 10:11:00	2013-02-07 10:11:00	t
39	KH	KHM	Cambodia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
40	CM	CMR	Cameroon	2013-02-07 10:11:00	2013-02-07 10:11:00	t
41	CA	CAN	Canada	2013-02-07 10:11:00	2013-02-07 10:11:00	t
42	CV	CPV	Cape Verde	2013-02-07 10:11:00	2013-02-07 10:11:00	t
43	KY	CYM	Cayman Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
44	CF	CAF	Central African Republic	2013-02-07 10:11:00	2013-02-07 10:11:00	t
45	TD	TCD	Chad	2013-02-07 10:11:00	2013-02-07 10:11:00	t
46	CL	CHL	Chile	2013-02-07 10:11:00	2013-02-07 10:11:00	t
47	CN	CHN	China	2013-02-07 10:11:00	2013-02-07 10:11:00	t
48	CX	CXR	Christmas Island	2013-02-07 10:11:00	2013-02-07 10:11:00	t
49	CC	CCK	Cocos Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
50	CO	COL	Colombia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
51	KM	COM	Comoros	2013-02-07 10:11:00	2013-02-07 10:11:00	t
52	CK	COK	Cook Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
53	CR	CRI	Costa Rica	2013-02-07 10:11:00	2013-02-07 10:11:00	t
54	HR	HRV	Croatia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
55	CU	CUB	Cuba	2013-02-07 10:11:00	2013-02-07 10:11:00	t
56	CW	CUW	Curacao	2013-02-07 10:11:00	2013-02-07 10:11:00	t
57	CY	CYP	Cyprus	2013-02-07 10:11:00	2013-02-07 10:11:00	t
58	CZ	CZE	Czech Republic	2013-02-07 10:11:00	2013-02-07 10:11:00	t
59	CD	COD	Democratic Republic of the Congo	2013-02-07 10:11:00	2013-02-07 10:11:00	t
60	DK	DNK	Denmark	2013-02-07 10:11:00	2013-02-07 10:11:00	t
61	DJ	DJI	Djibouti	2013-02-07 10:11:00	2013-02-07 10:11:00	t
62	DM	DMA	Dominica	2013-02-07 10:11:00	2013-02-07 10:11:00	t
63	DO	DOM	Dominican Republic	2013-02-07 10:11:00	2013-02-07 10:11:00	t
64	TL	TLS	East Timor	2013-02-07 10:11:00	2013-02-07 10:11:00	t
65	EC	ECU	Ecuador	2013-02-07 10:11:00	2013-02-07 10:11:00	t
66	EG	EGY	Egypt	2013-02-07 10:11:00	2013-02-07 10:11:00	t
67	SV	SLV	El Salvador	2013-02-07 10:11:00	2013-02-07 10:11:00	t
68	GQ	GNQ	Equatorial Guinea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
69	ER	ERI	Eritrea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
70	EE	EST	Estonia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
71	ET	ETH	Ethiopia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
72	FK	FLK	Falkland Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
73	FO	FRO	Faroe Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
74	FJ	FJI	Fiji	2013-02-07 10:11:00	2013-02-07 10:11:00	t
75	FI	FIN	Finland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
76	FR	FRA	France	2013-02-07 10:11:00	2013-02-07 10:11:00	t
77	GF	GUF	French Guiana	2013-02-07 10:11:00	2013-02-07 10:11:00	t
78	PF	PYF	French Polynesia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
79	TF	ATF	French Southern Territories	2013-02-07 10:11:00	2013-02-07 10:11:00	t
80	GA	GAB	Gabon	2013-02-07 10:11:00	2013-02-07 10:11:00	t
81	GM	GMB	Gambia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
82	GE	GEO	Georgia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
83	DE	DEU	Germany	2013-02-07 10:11:00	2013-02-07 10:11:00	t
84	GH	GHA	Ghana	2013-02-07 10:11:00	2013-02-07 10:11:00	t
85	GI	GIB	Gibraltar	2013-02-07 10:11:00	2013-02-07 10:11:00	t
86	GR	GRC	Greece	2013-02-07 10:11:00	2013-02-07 10:11:00	t
87	GL	GRL	Greenland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
88	GD	GRD	Grenada	2013-02-07 10:11:00	2013-02-07 10:11:00	t
89	GP	GLP	Guadeloupe	2013-02-07 10:11:00	2013-02-07 10:11:00	t
90	GU	GUM	Guam	2013-02-07 10:11:00	2013-02-07 10:11:00	t
91	GT	GTM	Guatemala	2013-02-07 10:11:00	2013-02-07 10:11:00	t
92	GG	GGY	Guernsey	2013-02-07 10:11:00	2013-02-07 10:11:00	t
93	GN	GIN	Guinea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
94	GW	GNB	Guinea-Bissau	2013-02-07 10:11:00	2013-02-07 10:11:00	t
95	GY	GUY	Guyana	2013-02-07 10:11:00	2013-02-07 10:11:00	t
96	HT	HTI	Haiti	2013-02-07 10:11:00	2013-02-07 10:11:00	t
97	HM	HMD	Heard Island and McDonald Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
98	HN	HND	Honduras	2013-02-07 10:11:00	2013-02-07 10:11:00	t
99	HK	HKG	Hong Kong	2013-02-07 10:11:00	2013-02-07 10:11:00	t
100	HU	HUN	Hungary	2013-02-07 10:11:00	2013-02-07 10:11:00	t
101	IS	ISL	Iceland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
102	IN	IND	India	2013-02-07 10:11:00	2013-02-07 10:11:00	t
103	ID	IDN	Indonesia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
104	IR	IRN	Iran	2013-02-07 10:11:00	2013-02-07 10:11:00	t
105	IQ	IRQ	Iraq	2013-02-07 10:11:00	2013-02-07 10:11:00	t
106	IE	IRL	Ireland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
107	IM	IMN	Isle of Man	2013-02-07 10:11:00	2013-02-07 10:11:00	t
108	IL	ISR	Israel	2013-02-07 10:11:00	2013-02-07 10:11:00	t
109	IT	ITA	Italy	2013-02-07 10:11:00	2013-02-07 10:11:00	t
110	CI	CIV	Ivory Coast	2013-02-07 10:11:00	2013-02-07 10:11:00	t
111	JM	JAM	Jamaica	2013-02-07 10:11:00	2013-02-07 10:11:00	t
112	JP	JPN	Japan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
113	JE	JEY	Jersey	2013-02-07 10:11:00	2013-02-07 10:11:00	t
114	JO	JOR	Jordan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
115	KZ	KAZ	Kazakhstan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
116	KE	KEN	Kenya	2013-02-07 10:11:00	2013-02-07 10:11:00	t
117	KI	KIR	Kiribati	2013-02-07 10:11:00	2013-02-07 10:11:00	t
118	XK	XKX	Kosovo	2013-02-07 10:11:00	2013-02-07 10:11:00	t
119	KW	KWT	Kuwait	2013-02-07 10:11:00	2013-02-07 10:11:00	t
120	KG	KGZ	Kyrgyzstan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
121	LA	LAO	Laos	2013-02-07 10:11:00	2013-02-07 10:11:00	t
122	LV	LVA	Latvia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
123	LB	LBN	Lebanon	2013-02-07 10:11:00	2013-02-07 10:11:00	t
124	LS	LSO	Lesotho	2013-02-07 10:11:00	2013-02-07 10:11:00	t
125	LR	LBR	Liberia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
126	LY	LBY	Libya	2013-02-07 10:11:00	2013-02-07 10:11:00	t
127	LI	LIE	Liechtenstein	2013-02-07 10:11:00	2013-02-07 10:11:00	t
128	LT	LTU	Lithuania	2013-02-07 10:11:00	2013-02-07 10:11:00	t
129	LU	LUX	Luxembourg	2013-02-07 10:11:00	2013-02-07 10:11:00	t
130	MO	MAC	Macao	2013-02-07 10:11:00	2013-02-07 10:11:00	t
131	MK	MKD	Macedonia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
132	MG	MDG	Madagascar	2013-02-07 10:11:00	2013-02-07 10:11:00	t
133	MW	MWI	Malawi	2013-02-07 10:11:00	2013-02-07 10:11:00	t
134	MY	MYS	Malaysia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
135	MV	MDV	Maldives	2013-02-07 10:11:00	2013-02-07 10:11:00	t
136	ML	MLI	Mali	2013-02-07 10:11:00	2013-02-07 10:11:00	t
137	MT	MLT	Malta	2013-02-07 10:11:00	2013-02-07 10:11:00	t
138	MH	MHL	Marshall Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
139	MQ	MTQ	Martinique	2013-02-07 10:11:00	2013-02-07 10:11:00	t
140	MR	MRT	Mauritania	2013-02-07 10:11:00	2013-02-07 10:11:00	t
141	MU	MUS	Mauritius	2013-02-07 10:11:00	2013-02-07 10:11:00	t
142	YT	MYT	Mayotte	2013-02-07 10:11:00	2013-02-07 10:11:00	t
143	MX	MEX	Mexico	2013-02-07 10:11:00	2013-02-07 10:11:00	t
144	FM	FSM	Micronesia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
145	MD	MDA	Moldova	2013-02-07 10:11:00	2013-02-07 10:11:00	t
146	MC	MCO	Monaco	2013-02-07 10:11:00	2013-02-07 10:11:00	t
147	MN	MNG	Mongolia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
148	ME	MNE	Montenegro	2013-02-07 10:11:00	2013-02-07 10:11:00	t
149	MS	MSR	Montserrat	2013-02-07 10:11:00	2013-02-07 10:11:00	t
150	MA	MAR	Morocco	2013-02-07 10:11:00	2013-02-07 10:11:00	t
151	MZ	MOZ	Mozambique	2013-02-07 10:11:00	2013-02-07 10:11:00	t
152	MM	MMR	Myanmar	2013-02-07 10:11:00	2013-02-07 10:11:00	t
153	NA	NAM	Namibia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
154	NR	NRU	Nauru	2013-02-07 10:11:00	2013-02-07 10:11:00	t
155	NP	NPL	Nepal	2013-02-07 10:11:00	2013-02-07 10:11:00	t
156	NL	NLD	Netherlands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
157	AN	ANT	Netherlands Antilles	2013-02-07 10:11:00	2013-02-07 10:11:00	t
158	NC	NCL	New Caledonia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
159	NZ	NZL	New Zealand	2013-02-07 10:11:00	2013-02-07 10:11:00	t
160	NI	NIC	Nicaragua	2013-02-07 10:11:00	2013-02-07 10:11:00	t
161	NE	NER	Niger	2013-02-07 10:11:00	2013-02-07 10:11:00	t
162	NG	NGA	Nigeria	2013-02-07 10:11:00	2013-02-07 10:11:00	t
163	NU	NIU	Niue	2013-02-07 10:11:00	2013-02-07 10:11:00	t
164	NF	NFK	Norfolk Island	2013-02-07 10:11:00	2013-02-07 10:11:00	t
165	KP	PRK	North Korea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
166	MP	MNP	Northern Mariana Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
167	NO	NOR	Norway	2013-02-07 10:11:00	2013-02-07 10:11:00	t
168	OM	OMN	Oman	2013-02-07 10:11:00	2013-02-07 10:11:00	t
169	PK	PAK	Pakistan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
170	PW	PLW	Palau	2013-02-07 10:11:00	2013-02-07 10:11:00	t
171	PS	PSE	Palestinian Territory	2013-02-07 10:11:00	2013-02-07 10:11:00	t
172	PA	PAN	Panama	2013-02-07 10:11:00	2013-02-07 10:11:00	t
173	PG	PNG	Papua New Guinea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
174	PY	PRY	Paraguay	2013-02-07 10:11:00	2013-02-07 10:11:00	t
175	PE	PER	Peru	2013-02-07 10:11:00	2013-02-07 10:11:00	t
176	PH	PHL	Philippines	2013-02-07 10:11:00	2013-02-07 10:11:00	t
177	PN	PCN	Pitcairn	2013-02-07 10:11:00	2013-02-07 10:11:00	t
178	PL	POL	Poland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
179	PT	PRT	Portugal	2013-02-07 10:11:00	2013-02-07 10:11:00	t
180	PR	PRI	Puerto Rico	2013-02-07 10:11:00	2013-02-07 10:11:00	t
181	QA	QAT	Qatar	2013-02-07 10:11:00	2013-02-07 10:11:00	t
182	CG	COG	Republic of the Congo	2013-02-07 10:11:00	2013-02-07 10:11:00	t
183	RE	REU	Reunion	2013-02-07 10:11:00	2013-02-07 10:11:00	t
184	RO	ROU	Romania	2013-02-07 10:11:00	2013-02-07 10:11:00	t
185	RU	RUS	Russia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
186	RW	RWA	Rwanda	2013-02-07 10:11:00	2013-02-07 10:11:00	t
187	BL	BLM	Saint Barthelemy	2013-02-07 10:11:00	2013-02-07 10:11:00	t
188	SH	SHN	Saint Helena	2013-02-07 10:11:00	2013-02-07 10:11:00	t
189	KN	KNA	Saint Kitts and Nevis	2013-02-07 10:11:00	2013-02-07 10:11:00	t
190	LC	LCA	Saint Lucia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
191	MF	MAF	Saint Martin	2013-02-07 10:11:00	2013-02-07 10:11:00	t
192	PM	SPM	Saint Pierre and Miquelon	2013-02-07 10:11:00	2013-02-07 10:11:00	t
193	VC	VCT	Saint Vincent and the Grenadines	2013-02-07 10:11:00	2013-02-07 10:11:00	t
194	WS	WSM	Samoa	2013-02-07 10:11:00	2013-02-07 10:11:00	t
195	SM	SMR	San Marino	2013-02-07 10:11:00	2013-02-07 10:11:00	t
196	ST	STP	Sao Tome and Principe	2013-02-07 10:11:00	2013-02-07 10:11:00	t
197	SA	SAU	Saudi Arabia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
198	SN	SEN	Senegal	2013-02-07 10:11:00	2013-02-07 10:11:00	t
199	RS	SRB	Serbia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
200	CS	SCG	Serbia and Montenegro	2013-02-07 10:11:00	2013-02-07 10:11:00	t
201	SC	SYC	Seychelles	2013-02-07 10:11:00	2013-02-07 10:11:00	t
202	SL	SLE	Sierra Leone	2013-02-07 10:11:00	2013-02-07 10:11:00	t
203	SG	SGP	Singapore	2013-02-07 10:11:00	2013-02-07 10:11:00	t
204	SX	SXM	Sint Maarten	2013-02-07 10:11:00	2013-02-07 10:11:00	t
205	SK	SVK	Slovakia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
206	SI	SVN	Slovenia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
207	SB	SLB	Solomon Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
208	SO	SOM	Somalia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
209	ZA	ZAF	South Africa	2013-02-07 10:11:00	2013-02-07 10:11:00	t
210	GS	SGS	South Georgia and the South Sandwich Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
211	KR	KOR	South Korea	2013-02-07 10:11:00	2013-02-07 10:11:00	t
212	SS	SSD	South Sudan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
213	ES	ESP	Spain	2013-02-07 10:11:00	2013-02-07 10:11:00	t
214	LK	LKA	Sri Lanka	2013-02-07 10:11:00	2013-02-07 10:11:00	t
215	SD	SDN	Sudan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
216	SR	SUR	Suriname	2013-02-07 10:11:00	2013-02-07 10:11:00	t
217	SJ	SJM	Svalbard and Jan Mayen	2013-02-07 10:11:00	2013-02-07 10:11:00	t
218	SZ	SWZ	Swaziland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
219	SE	SWE	Sweden	2013-02-07 10:11:00	2013-02-07 10:11:00	t
220	CH	CHE	Switzerland	2013-02-07 10:11:00	2013-02-07 10:11:00	t
221	SY	SYR	Syria	2013-02-07 10:11:00	2013-02-07 10:11:00	t
222	TW	TWN	Taiwan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
223	TJ	TJK	Tajikistan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
224	TZ	TZA	Tanzania	2013-02-07 10:11:00	2013-02-07 10:11:00	t
225	TH	THA	Thailand	2013-02-07 10:11:00	2013-02-07 10:11:00	t
226	TG	TGO	Togo	2013-02-07 10:11:00	2013-02-07 10:11:00	t
227	TK	TKL	Tokelau	2013-02-07 10:11:00	2013-02-07 10:11:00	t
228	TO	TON	Tonga	2013-02-07 10:11:00	2013-02-07 10:11:00	t
229	TT	TTO	Trinidad and Tobago	2013-02-07 10:11:00	2013-02-07 10:11:00	t
230	TN	TUN	Tunisia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
231	TR	TUR	Turkey	2013-02-07 10:11:00	2013-02-07 10:11:00	t
232	TM	TKM	Turkmenistan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
233	TC	TCA	Turks and Caicos Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
234	TV	TUV	Tuvalu	2013-02-07 10:11:00	2013-02-07 10:11:00	t
235	VI	VIR	U.S. Virgin Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
236	UG	UGA	Uganda	2013-02-07 10:11:00	2013-02-07 10:11:00	t
237	UA	UKR	Ukraine	2013-02-07 10:11:00	2013-02-07 10:11:00	t
238	AE	ARE	United Arab Emirates	2013-02-07 10:11:00	2013-02-07 10:11:00	t
239	GB	GBR	United Kingdom	2013-02-07 10:11:00	2013-02-07 10:11:00	t
240	US	USA	United States	2013-02-07 10:11:00	2013-02-07 10:11:00	t
241	UM	UMI	United States Minor Outlying Islands	2013-02-07 10:11:00	2013-02-07 10:11:00	t
242	UY	URY	Uruguay	2013-02-07 10:11:00	2013-02-07 10:11:00	t
243	UZ	UZB	Uzbekistan	2013-02-07 10:11:00	2013-02-07 10:11:00	t
244	VU	VUT	Vanuatu	2013-02-07 10:11:00	2013-02-07 10:11:00	t
245	VA	VAT	Vatican	2013-02-07 10:11:00	2013-02-07 10:11:00	t
246	VE	VEN	Venezuela	2013-02-07 10:11:00	2013-02-07 10:11:00	t
247	VN	VNM	Vietnam	2013-02-07 10:11:00	2013-02-07 10:11:00	t
248	WF	WLF	Wallis and Futuna	2013-02-07 10:11:00	2013-02-07 10:11:00	t
249	EH	ESH	Western Sahara	2013-02-07 10:11:00	2013-02-07 10:11:00	t
250	YE	YEM	Yemen	2013-02-07 10:11:00	2013-02-07 10:11:00	t
251	ZM	ZMB	Zambia	2013-02-07 10:11:00	2013-02-07 10:11:00	t
252	ZW	ZWE	Zimbabwe	2013-02-07 10:11:00	2013-02-07 10:11:00	t
3	AL	ALB	Albania	2013-02-07 10:11:00	2013-04-11 16:15:53.73	t
\.


--
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('countries_id_seq', 252, true);


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY coupons (id, created, modified, teacher_user_id, course_id, coupon_code, max_number_of_time_can_use, coupon_user_count, is_active) FROM stdin;
\.


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('coupons_id_seq', 1, false);


--
-- Data for Name: course_favourites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY course_favourites (id, course_id, created, modified, user_id) FROM stdin;
\.


--
-- Name: course_favourites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_favourites_id_seq', 950, true);


--
-- Name: course_levels_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_levels_subscriptions_id_seq', 6, true);


--
-- Data for Name: course_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY course_statuses (id, created, modified, name) FROM stdin;
1	2015-11-11 21:13:51.655	2015-11-11 21:13:51.655	Draft
2	2015-11-11 21:14:17.05	2015-11-11 21:14:17.05	Waiting for Approval
3	2015-11-11 21:14:33.657	2015-11-11 21:14:33.657	Active
\.


--
-- Name: course_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_statuses_id_seq', 3, true);


--
-- Name: course_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_types_id_seq', 3, true);


--
-- Data for Name: course_user_feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY course_user_feedbacks (id, course_id, course_user_id, created, feedback, modified, user_id, rating, review_title) FROM stdin;
\.


--
-- Name: course_user_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_user_feedbacks_id_seq', 18, true);


--
-- Data for Name: course_user_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY course_user_statuses (id, created, modified, name, slug) FROM stdin;
1	2013-04-11 16:16:33.98	2013-04-11 16:16:33.98	Payment pending	payment_pending
4	2013-04-11 16:16:33.98	2013-04-11 16:16:33.98	Completed	completed
2	2013-04-11 16:16:33.98	2013-04-11 16:16:33.98	Not Started	not_started
3	2013-04-11 16:16:33.98	2013-04-11 16:16:33.98	In Progress	in_progress
5	2013-04-11 16:16:33.98	2013-04-11 16:16:33.98	Archived	archived
\.


--
-- Name: course_user_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_user_statuses_id_seq', 5, true);


--
-- Data for Name: course_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY course_users (id, booked_date, completed_date, course_id, course_user_status_id, created, modified, paykey, price, site_commission_amount, user_id, viewed_lesson_count, coupon_id, paypal_pay_key, payment_gateway_id) FROM stdin;
\.


--
-- Name: course_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_users_id_seq', 34, true);


--
-- Name: course_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('course_views_id_seq', 935, false);


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY courses (id, category_id, course_favourite_count, course_user_count, course_view_count, created, description, intro_video_embedded_code, intro_video_thumb_url, intro_video_url, is_suspend, modified, parent_category_id, price, site_revenue_amount, title, total_revenue_amount, user_id, is_active, course_image, subtitle, students_will_be_able_to, who_should_take_this_course_and_who_should_not, what_actions_students_have_to_perform_before_begin, instructional_level_id, language_id, course_user_feedback_count, total_rating, average_rating, online_course_lesson_count, background_picture_url, is_public, image_hash, course_status_id, active_online_course_lesson_count, meta_keywords, meta_description, is_favourite, promo_video, is_featured, mooc_affiliate_course_link, is_promo_video_converting_is_processing, is_promo_video_convert_error, is_from_mooc_affiliate, slug) FROM stdin;
\.


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('courses_id_seq', 882, true);


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY email_templates (id, content, created, filename, from_name, info, modified, name, reply_to, subject) FROM stdin;
1	Hi ##USERNAME##,\r\n\r\nYour account has been created. \r\n\r\nPlease visit the following URL to activate your account.\r\n\r\n##ACTIVATION_URL##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-17 10:11:00	activation_request	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##ACTIVATION_URL##, ##USERNAME##	2013-07-17 13:36:00.919	Activation Request		Please activate your ##SITE_NAME## account
2	Hi ##USERNAME##,\r\n\r\nYour account has been activated.\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	admin_user_active	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##USERNAME##	2013-02-07 10:11:00	Admin User Active	\N	Your ##SITE_NAME## account has been activated
3	Hi ##USERNAME##,\r\n\r\n##SITE_NAME## team added you as a user in ##SITE_NAME##.\r\n\r\nYour account details,\r\n\r\nUsername: ##USERNAME##\r\n\r\nPassword: ##PASSWORD##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	admin_user_add	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##USERNAME##	2013-02-07 10:11:00	Admin User Add	\N	Welcome to ##SITE_NAME##
4	Hi ##USERNAME##,\r\n\r\nYour ##SITE_NAME## account has been deactivated.\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	admin_user_deactivate	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##	2013-02-07 10:11:00	Admin User Deactivate	\N	Your ##SITE_NAME## account has been deactivated
5	Hi ##USERNAME##,\r\n\r\nYour ##SITE_NAME## account has been removed.\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	admin_user_delete	##FROM_EMAIL##	##SITE_NAME## , ##SITE_URL##, ##USERNAME##	2013-02-07 10:11:00	Admin User Delete	\N	Your ##SITE_NAME## account has been removed
7	##MESSAGE## 	2013-02-07 10:11:00	contact_us	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##MESSAGE## 	2013-02-07 10:11:00	Contact Us	\N	[##SITE_NAME##] ##SUBJECT##
8	Hi ##USERNAME##,\r\n\r\nThanks for contacting us. We'll get back to you shortly.\r\n\r\nPlease do not reply to this automated response. If you have not contacted us and if you feel this is an error, please contact us through our site ##CONTACT_URL##\r\n\r\n------ you wrote -----\r\n##MESSAGE##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL## 	2015-09-16 12:09:09.88	contact_us_auto_reply	##SITE_NAME## (auto response) ##FROM_EMAIL##	##USERNAME##,##SITE_URL_WITHOUT_SLASH##, ##CONTACT_URL##, ##MESSAGE##, ##SITE_NAME##, ##SITE_URL## "	2015-09-16 12:09:09.88	Contact Us Auto Reply		##SITE_NAME## RE: ##SUBJECT##
13	Hi ##USERNAME##,\r\n\r\nA password request has been made for your user account at ##SITE_NAME##.\r\n\r\nNew password: ##PASSWORD##\r\n\r\nIf you did not request this action and feel this is in error, please contact us at ##CONTACT_MAIL##.\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	forgot_password	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##SITE_NAME##, ##PASSWORD##, ##TO_EMAIL##	2013-02-07 10:11:00	Forgot Password	\N	Forgot Password
14	Hi, \r\n\r\nA new user named "##USERNAME##" has joined in ##SITE_NAME## account. \r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	new_user_join	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL## 	2013-02-07 10:11:00	New User Join	\N	##SITE_NAME## New user joined in ##SITE_NAME## account
19	Hi ##USERNAME##,\r\n\r\nWe wish to say a quick hello and thanks for registering at ##SITE_NAME##.\r\n\r\nIf you did not request this account and feel this is an error, please\r\n\r\ncontact us at ##CONTACT_URL##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL## 	2013-02-07 10:11:00	welcome_mail	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL## , ##SITE_URL_WITHOUT_SLASH##, ##CONTACT_URL##, ##USERNAME##	2013-07-23 20:42:16.841	Welcome Mail		Welcome to ##SITE_NAME##
28	Hi ##USERNAME##,\r\n\r\nYour withdrawal request has been rejected.\r\n\r\nAmount: ##CURRENCY####AMOUNT##\r\n\r\nYour Current Balance: ##CURRENCY####CURRENT_BALANCE##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2016-03-25 11:41:03.992	admin_withdrawal_request_rejected	##FROM_EMAIL##	##SITE_NAME## , ##SITE_URL##	2016-03-25 11:41:03.992	Withdrawal Request Rejected	\N	Your withdrawal request was rejected.
27	Hi ##USERNAME##,\r\n\r\nYour withdrawal request has been approved.\r\n\r\nAmount: ##CURRENCY####AMOUNT##\r\n\r\nYour Current Balance: ##CURRENCY####CURRENT_BALANCE##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2016-03-25 11:41:03.976	admin_withdrawal_request_approved	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##	2016-03-25 11:41:03.976	Withdrawal Request Approved	\N	Your withdrawal request was approved.
26	Hi, \r\n\r\nThe "##USERNAME##" has sent the withdrawal request.\r\n\r\nAmount: ##CURRENCY####AMOUNT##\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2016-03-25 11:41:03.945	withdrawal_request	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL## 	2016-03-25 11:41:03.945	New Withdrawal Request	\N	[##SITE_NAME##] New withdrawal request received
9	Hi ##USERNAME##,\r\n\r\n##OTHER_USERNAME## has booked your course ##COURSE_NAME##.\r\n\r\nThanks,\r\n##SITE_NAME##\r\n##SITE_URL##	2013-02-07 10:11:00	course_booking	##FROM_EMAIL##	##SITE_NAME##, ##SITE_URL##, ##USERNAME##, ##OTHER_USERNAME##, ##COURSE_NAME##	2013-02-07 10:11:00	Course Booking	\N	##OTHER_USERNAME## has booked your ##COURSE_NAME##!
\.


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('email_templates_id_seq', 28, true);


--
-- Name: existing_email_subscriber_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('existing_email_subscriber_levels_id_seq', 4, true);


--
-- Name: hibernate_sequence; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('hibernate_sequence', 953, true);


--
-- Data for Name: instructional_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY instructional_levels (id, created, modified, name, course_count, is_active) FROM stdin;
1	2015-10-29 17:52:24	2015-10-29 17:52:24	Beginner Level	0	1
2	2015-10-29 17:52:24	2015-10-29 17:52:24	Intermediate Level	0	1
3	2015-10-29 17:52:24	2015-10-29 17:52:24	Expert Level	0	1
4	2015-10-29 17:52:24	2015-10-29 17:52:24	All Levels	0	1
\.


--
-- Name: instructional_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('instructional_levels_id_seq', 4, true);


--
-- Data for Name: instructional_levels_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY instructional_levels_subscriptions (id, subscription_id, instructional_level_id, created, modified) FROM stdin;
1	1	1	\N	\N
2	1	2	\N	\N
3	2	1	\N	\N
4	2	2	\N	\N
5	2	3	\N	\N
6	2	4	\N	\N
\.


--
-- Name: instructional_levels_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('instructional_levels_subscriptions_id_seq', 6, true);


--
-- Data for Name: ipn_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY ipn_logs (id, created, modified, post_variable, ip_id, course_user_id, user_subscription_log_id, user_subscription_id, payment_gateway_id) FROM stdin;
\.


--
-- Name: ipn_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('ipn_logs_id_seq', 3, true);


--
-- Data for Name: ips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY ips (id, city_id, country_id, created, host, ip, latitude, longitude, modified, state_id, timezone, user_agent) FROM stdin;
\.


--
-- Name: ips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('ips_id_seq', 614, true);


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY languages (id, created, modified, name, iso2, iso3, is_active) FROM stdin;
40	2009-07-01 13:52:25	2009-07-01 13:52:25	Dutch	nl	nld	1
42	2009-07-01 13:52:25	2009-07-01 13:52:25	English	en	eng	1
74	2009-07-01 13:52:25	2009-07-01 13:52:25	Italian	it	ita	1
75	2009-07-01 13:52:25	2009-07-01 13:52:25	Japanese	ja	jpn	1
129	2009-07-01 13:52:25	2009-07-01 13:52:25	Portuguese	pt	por	1
133	2009-07-01 13:52:25	2009-07-01 13:52:25	Russian	ru	rus	1
149	2009-07-01 13:52:25	2009-07-01 13:52:25	Spanish	es	spa	1
2	2009-07-01 13:52:24	2009-07-01 13:52:24	Afar	aa	aar	0
3	2009-07-01 13:52:24	2009-07-01 13:52:24	Afrikaans	af	afr	0
4	2009-07-01 13:52:24	2009-07-01 13:52:24	Akan	ak	aka	0
5	2009-07-01 13:52:25	2009-07-01 13:52:25	Albanian	sq	sqi	0
6	2009-07-01 13:52:24	2009-07-01 13:52:24	Amharic	am	amh	0
7	2009-07-01 13:52:24	2009-07-01 13:52:24	Arabic	ar	ara	0
8	2009-07-01 13:52:24	2009-07-01 13:52:24	Aragonese	an	arg	0
9	2009-07-01 13:52:25	2009-07-01 13:52:25	Armenian	hy	hye	0
10	2009-07-01 13:52:24	2009-07-01 13:52:24	Assamese	as	asm	0
11	2009-07-01 13:52:24	2009-07-01 13:52:24	Avaric	av	ava	0
12	2009-07-01 13:52:24	2009-07-01 13:52:24	Avestan	ae	ave	0
13	2009-07-01 13:52:24	2009-07-01 13:52:24	Aymara	ay	aym	0
14	2009-07-01 13:52:24	2009-07-01 13:52:24	Azerbaijani	az	aze	0
15	2009-07-01 13:52:24	2009-07-01 13:52:24	Bambara	bm	bam	0
16	2009-07-01 13:52:24	2009-07-01 13:52:24	Bashkir	ba	bak	0
17	2009-07-01 13:52:25	2009-07-01 13:52:25	Basque	eu	eus	0
18	2009-07-01 13:52:24	2009-07-01 13:52:24	Belarusian	be	bel	0
19	2009-07-01 13:52:24	2009-07-01 13:52:24	Bengali	bn	ben	0
20	2009-07-01 13:52:24	2009-07-01 13:52:24	Bihari	bh	bih	0
21	2009-07-01 13:52:24	2009-07-01 13:52:24	Bislama	bi	bis	0
22	2009-07-01 13:52:24	2009-07-01 13:52:24	Bosnian	bs	bos	0
23	2009-07-01 13:52:24	2009-07-01 13:52:24	Breton	br	bre	0
24	2009-07-01 13:52:24	2009-07-01 13:52:24	Bulgarian	bg	bul	0
25	2009-07-01 13:52:25	2009-07-01 13:52:25	Burmese	my	mya	0
26	2009-07-01 13:52:24	2009-07-01 13:52:24	Catalan	ca	cat	0
27	2009-07-01 13:52:25	2009-07-01 13:52:25	Chamorro	ch	cha	0
28	2009-07-01 13:52:25	2009-07-01 13:52:25	Chechen	ce	che	0
29	2009-07-01 13:52:25	2009-07-01 13:52:25	Chichewa	ny	nya	0
30	2009-07-01 13:52:25	2009-07-01 13:52:25	Chinese	zh	zho	0
31	2009-07-01 13:52:25	2009-07-01 13:52:25	Church Slavic	cu	chu	0
32	2009-07-01 13:52:25	2009-07-01 13:52:25	Chuvash	cv	chv	0
33	2009-07-01 13:52:25	2009-07-01 13:52:25	Cornish	kw	cor	0
34	2009-07-01 13:52:25	2009-07-01 13:52:25	Corsican	co	cos	0
35	2009-07-01 13:52:25	2009-07-01 13:52:25	Cree	cr	cre	0
36	2009-07-01 13:52:25	2009-07-01 13:52:25	Croatian	hr	hrv	0
37	2009-07-01 13:52:25	2009-07-01 13:52:25	Czech	cs	ces	0
38	2009-07-01 13:52:25	2009-07-01 13:52:25	Danish	da	dan	0
39	2009-07-01 13:52:25	2009-07-01 13:52:25	Divehi	dv	div	0
41	2009-07-01 13:52:25	2009-07-01 13:52:25	Dzongkha	dz	dzo	0
43	2009-07-01 13:52:25	2009-07-01 13:52:25	Esperanto	eo	epo	0
44	2009-07-01 13:52:25	2009-07-01 13:52:25	Estonian	et	est	0
45	2009-07-01 13:52:25	2009-07-01 13:52:25	Ewe	ee	ewe	0
46	2009-07-01 13:52:25	2009-07-01 13:52:25	Faroese	fo	fao	0
47	2009-07-01 13:52:25	2009-07-01 13:52:25	Fijian	fj	fij	0
48	2009-07-01 13:52:25	2009-07-01 13:52:25	Finnish	fi	fin	0
49	2009-07-01 13:52:25	2009-07-01 13:52:25	French	fr	fra	0
50	2009-07-01 13:52:25	2009-07-01 13:52:25	Fulah	ff	ful	0
51	2009-07-01 13:52:25	2009-07-01 13:52:25	Galician	gl	glg	0
52	2009-07-01 13:52:25	2009-07-01 13:52:25	Ganda	lg	lug	0
53	2009-07-01 13:52:25	2009-07-01 13:52:25	Georgian	ka	kat	0
54	2009-07-01 13:52:25	2009-07-01 13:52:25	German	de	deu	0
55	2009-07-01 13:52:25	2009-07-01 13:52:25	Greek	el	ell	0
56	2009-07-01 13:52:25	2009-07-01 13:52:25	Guaraní	gn	grn	0
57	2009-07-01 13:52:25	2009-07-01 13:52:25	Gujarati	gu	guj	0
58	2009-07-01 13:52:25	2009-07-01 13:52:25	Haitian	ht	hat	0
59	2009-07-01 13:52:25	2009-07-01 13:52:25	Hausa	ha	hau	0
60	2009-07-01 13:52:25	2009-07-01 13:52:25	Hebrew	he	heb	0
61	2009-07-01 13:52:25	2009-07-01 13:52:25	Herero	hz	her	0
62	2009-07-01 13:52:25	2009-07-01 13:52:25	Hindi	hi	hin	0
63	2009-07-01 13:52:25	2009-07-01 13:52:25	Hiri Motu	ho	hmo	0
64	2009-07-01 13:52:25	2009-07-01 13:52:25	Hungarian	hu	hun	0
65	2009-07-01 13:52:25	2009-07-01 13:52:25	Icelandic	is	isl	0
66	2009-07-01 13:52:25	2009-07-01 13:52:25	Ido	io	ido	0
67	2009-07-01 13:52:25	2009-07-01 13:52:25	Igbo	ig	ibo	0
68	2009-07-01 13:52:25	2009-07-01 13:52:25	Indonesian	id	ind	0
69	2009-07-01 13:52:25	2009-07-01 13:52:25	Interlingua (International Auxiliary Language Association)	ia	ina	0
70	2009-07-01 13:52:25	2009-07-01 13:52:25	Interlingue	ie	ile	0
71	2009-07-01 13:52:25	2009-07-01 13:52:25	Inuktitut	iu	iku	0
72	2009-07-01 13:52:25	2009-07-01 13:52:25	Inupiaq	ik	ipk	0
73	2009-07-01 13:52:25	2009-07-01 13:52:25	Irish	ga	gle	0
76	2009-07-01 13:52:25	2009-07-01 13:52:25	Javanese	jv	jav	0
77	2009-07-01 13:52:25	2009-07-01 13:52:25	Kalaallisut	kl	kal	0
78	2009-07-01 13:52:25	2009-07-01 13:52:25	Kannada	kn	kan	0
79	2009-07-01 13:52:25	2009-07-01 13:52:25	Kanuri	kr	kau	0
80	2009-07-01 13:52:25	2009-07-01 13:52:25	Kashmiri	ks	kas	0
81	2009-07-01 13:52:25	2009-07-01 13:52:25	Kazakh	kk	kaz	0
82	2009-07-01 13:52:25	2009-07-01 13:52:25	Khmer	km	khm	0
83	2009-07-01 13:52:25	2009-07-01 13:52:25	Kikuyu	ki	kik	0
84	2009-07-01 13:52:25	2009-07-01 13:52:25	Kinyarwanda	rw	kin	0
85	2009-07-01 13:52:25	2009-07-01 13:52:25	Kirghiz	ky	kir	0
86	2009-07-01 13:52:25	2009-07-01 13:52:25	Kirundi	rn	run	0
87	2009-07-01 13:52:25	2009-07-01 13:52:25	Komi	kv	kom	0
88	2009-07-01 13:52:25	2009-07-01 13:52:25	Kongo	kg	kon	0
89	2009-07-01 13:52:25	2009-07-01 13:52:25	Korean	ko	kor	0
90	2009-07-01 13:52:25	2009-07-01 13:52:25	Kurdish	ku	kur	0
91	2009-07-01 13:52:25	2009-07-01 13:52:25	Kwanyama	kj	kua	0
92	2009-07-01 13:52:25	2009-07-01 13:52:25	Lao	lo	lao	0
93	2009-07-01 13:52:25	2009-07-01 13:52:25	Latin	la	lat	0
94	2009-07-01 13:52:25	2009-07-01 13:52:25	Latvian	lv	lav	0
95	2009-07-01 13:52:25	2009-07-01 13:52:25	Limburgish	li	lim	0
96	2009-07-01 13:52:25	2009-07-01 13:52:25	Lingala	ln	lin	0
97	2009-07-01 13:52:25	2009-07-01 13:52:25	Lithuanian	lt	lit	0
98	2009-07-01 13:52:25	2009-07-01 13:52:25	Luba-Katanga	lu	lub	0
99	2009-07-01 13:52:25	2009-07-01 13:52:25	Luxembourgish	lb	ltz	0
100	2009-07-01 13:52:25	2009-07-01 13:52:25	Macedonian	mk	mkd	0
101	2009-07-01 13:52:25	2009-07-01 13:52:25	Malagasy	mg	mlg	0
102	2009-07-01 13:52:25	2009-07-01 13:52:25	Malay	ms	msa	0
103	2009-07-01 13:52:25	2009-07-01 13:52:25	Malayalam	ml	mal	0
104	2009-07-01 13:52:25	2009-07-01 13:52:25	Maltese	mt	mlt	0
105	2009-07-01 13:52:25	2009-07-01 13:52:25	Manx	gv	glv	0
106	2009-07-01 13:52:25	2009-07-01 13:52:25	Māori	mi	mri	0
107	2009-07-01 13:52:25	2009-07-01 13:52:25	Marathi	mr	mar	0
108	2009-07-01 13:52:25	2009-07-01 13:52:25	Marshallese	mh	mah	0
109	2009-07-01 13:52:25	2009-07-01 13:52:25	Mongolian	mn	mon	0
110	2009-07-01 13:52:25	2009-07-01 13:52:25	Nauru	na	nau	0
111	2009-07-01 13:52:25	2009-07-01 13:52:25	Navajo	nv	nav	0
112	2009-07-01 13:52:25	2009-07-01 13:52:25	Ndonga	ng	ndo	0
113	2009-07-01 13:52:25	2009-07-01 13:52:25	Nepali	ne	nep	0
114	2009-07-01 13:52:25	2009-07-01 13:52:25	North Ndebele	nd	nde	0
115	2009-07-01 13:52:25	2009-07-01 13:52:25	Northern Sami	se	sme	0
116	2009-07-01 13:52:25	2009-07-01 13:52:25	Norwegian	no	nor	0
117	2009-07-01 13:52:25	2009-07-01 13:52:25	Norwegian Bokmål	nb	nob	0
118	2009-07-01 13:52:25	2009-07-01 13:52:25	Norwegian Nynorsk	nn	nno	0
119	2009-07-01 13:52:25	2009-07-01 13:52:25	Occitan	oc	oci	0
120	2009-07-01 13:52:25	2009-07-01 13:52:25	Ojibwa	oj	oji	0
121	2009-07-01 13:52:25	2009-07-01 13:52:25	Oriya	or	ori	0
122	2009-07-01 13:52:25	2009-07-01 13:52:25	Oromo	om	orm	0
123	2009-07-01 13:52:25	2009-07-01 13:52:25	Ossetian	os	oss	0
124	2009-07-01 13:52:25	2009-07-01 13:52:25	Pāli	pi	pli	0
125	2009-07-01 13:52:25	2009-07-01 13:52:25	Panjabi	pa	pan	0
126	2009-07-01 13:52:25	2009-07-01 13:52:25	Pashto	ps	pus	0
127	2009-07-01 13:52:25	2009-07-01 13:52:25	Persian	fa	fas	0
128	2009-07-01 13:52:25	2009-07-01 13:52:25	Polish	pl	pol	0
130	2009-07-01 13:52:25	2009-07-01 13:52:25	Quechua	qu	que	0
131	2009-07-01 13:52:25	2009-07-01 13:52:25	Raeto-Romance	rm	roh	0
132	2009-07-01 13:52:25	2009-07-01 13:52:25	Romanian	ro	ron	0
134	2009-07-01 13:52:25	2009-07-01 13:52:25	Samoan	sm	smo	0
135	2009-07-01 13:52:25	2009-07-01 13:52:25	Sango	sg	sag	0
136	2009-07-01 13:52:25	2009-07-01 13:52:25	Sanskrit	sa	san	0
137	2009-07-01 13:52:25	2009-07-01 13:52:25	Sardinian	sc	srd	0
138	2009-07-01 13:52:25	2009-07-01 13:52:25	Scottish Gaelic	gd	gla	0
139	2009-07-01 13:52:25	2009-07-01 13:52:25	Serbian	sr	srp	0
140	2009-07-01 13:52:25	2009-07-01 13:52:25	Shona	sn	sna	0
141	2009-07-01 13:52:25	2009-07-01 13:52:25	Sichuan Yi	ii	iii	0
142	2009-07-01 13:52:25	2009-07-01 13:52:25	Sindhi	sd	snd	0
143	2009-07-01 13:52:25	2009-07-01 13:52:25	Sinhala	si	sin	0
144	2009-07-01 13:52:25	2009-07-01 13:52:25	Slovak	sk	slk	0
145	2009-07-01 13:52:25	2009-07-01 13:52:25	Slovenian	sl	slv	0
146	2009-07-01 13:52:25	2009-07-01 13:52:25	Somali	so	som	0
147	2009-07-01 13:52:25	2009-07-01 13:52:25	South Ndebele	nr	nbl	0
148	2009-07-01 13:52:25	2009-07-01 13:52:25	Southern Sotho	st	sot	0
150	2009-07-01 13:52:25	2009-07-01 13:52:25	Sundanese	su	sun	0
151	2009-07-01 13:52:25	2009-07-01 13:52:25	Swahili	sw	swa	0
152	2009-07-01 13:52:25	2009-07-01 13:52:25	Swati	ss	ssw	0
153	2009-07-01 13:52:25	2009-07-01 13:52:25	Swedish	sv	swe	0
154	2009-07-01 13:52:25	2009-07-01 13:52:25	Tagalog	tl	tgl	0
155	2009-07-01 13:52:25	2009-07-01 13:52:25	Tahitian	ty	tah	0
156	2009-07-01 13:52:25	2009-07-01 13:52:25	Tajik	tg	tgk	0
157	2009-07-01 13:52:25	2009-07-01 13:52:25	Tamil	ta	tam	0
158	2009-07-01 13:52:25	2009-07-01 13:52:25	Tatar	tt	tat	0
159	2009-07-01 13:52:25	2009-07-01 13:52:25	Telugu	te	tel	0
160	2009-07-01 13:52:25	2009-07-01 13:52:25	Thai	th	tha	0
161	2009-07-01 13:52:24	2009-07-01 13:52:24	Tibetan	bo	bod	0
162	2009-07-01 13:52:25	2009-07-01 13:52:25	Tigrinya	ti	tir	0
163	2009-07-01 13:52:25	2009-07-01 13:52:25	Tonga	to	ton	0
164	2009-07-01 13:52:25	2009-07-01 13:52:25	Traditional Chinese	zh-TW	zh-TW	0
165	2009-07-01 13:52:25	2009-07-01 13:52:25	Tsonga	ts	tso	0
166	2009-07-01 13:52:25	2009-07-01 13:52:25	Tswana	tn	tsn	0
167	2009-07-01 13:52:25	2009-07-01 13:52:25	Turkish	tr	tur	0
168	2009-07-01 13:52:25	2009-07-01 13:52:25	Turkmen	tk	tuk	0
169	2009-07-01 13:52:25	2009-07-01 13:52:25	Twi	tw	twi	0
170	2009-07-01 13:52:25	2009-07-01 13:52:25	Uighur	ug	uig	0
171	2009-07-01 13:52:25	2009-07-01 13:52:25	Ukrainian	uk	ukr	0
172	2009-07-01 13:52:25	2009-07-01 13:52:25	Urdu	ur	urd	0
173	2009-07-01 13:52:25	2009-07-01 13:52:25	Uzbek	uz	uzb	0
174	2009-07-01 13:52:25	2009-07-01 13:52:25	Venda	ve	ven	0
175	2009-07-01 13:52:25	2009-07-01 13:52:25	Vietnamese	vi	vie	0
176	2009-07-01 13:52:25	2009-07-01 13:52:25	Volapük	vo	vol	0
177	2009-07-01 13:52:25	2009-07-01 13:52:25	Walloon	wa	wln	0
178	2009-07-01 13:52:25	2009-07-01 13:52:25	Welsh	cy	cym	0
179	2009-07-01 13:52:25	2009-07-01 13:52:25	Western Frisian	fy	fry	0
180	2009-07-01 13:52:25	2009-07-01 13:52:25	Wolof	wo	wol	0
181	2009-07-01 13:52:25	2009-07-01 13:52:25	Xhosa	xh	xho	0
182	2009-07-01 13:52:25	2009-07-01 13:52:25	Yiddish	yi	yid	0
183	2009-07-01 13:52:25	2009-07-01 13:52:25	Yoruba	yo	yor	0
184	2009-07-01 13:52:25	2009-07-01 13:52:25	Zhuang	za	zha	0
185	2009-07-01 13:52:25	2009-07-01 13:52:25	Zulu	zu	zul	0
1	2009-07-01 13:52:24	2013-04-11 17:09:26.043	Abkhazian	ab	abk	0
\.


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('languages_id_seq', 185, true);


--
-- Data for Name: money_transfer_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY money_transfer_accounts (id, created, modified, user_id, account) FROM stdin;
\.


--
-- Name: money_transfer_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('money_transfer_accounts_id_seq', 3, true);


--
-- Data for Name: oauth_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_access_tokens (access_token, client_id, user_id, expires, scope) FROM stdin;
03e281233bf3bd725f54875dd66d4bc8f4ccdeb6	7742632501382313	\N	2100-12-31 23:59:52	\N
\.


--
-- Data for Name: oauth_authorization_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_authorization_codes (authorization_code, client_id, user_id, redirect_uri, expires, scope) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_clients (client_id, client_secret, redirect_uri, grant_types, scope, user_id) FROM stdin;
7742632501382313	4g7C4l1Y2b0S6a7L8c1E7B3K0e	http://localhost/ace/api/r.php	client_credentials password	\N	40
7742632501382313	4g7C4l1Y2b0S6a7L8c1E7B3K0e	http://localhost/ace/api/r.php	client_credentials password	\N	40
\.


--
-- Data for Name: oauth_jwt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_jwt (client_id, subject, public_key) FROM stdin;
\.


--
-- Data for Name: oauth_refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_refresh_tokens (refresh_token, client_id, user_id, expires, scope) FROM stdin;
\.


--
-- Data for Name: oauth_scopes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY oauth_scopes (scope, is_default) FROM stdin;
\.


--
-- Data for Name: online_course_lesson_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY online_course_lesson_views (id, course_id, created, modified, online_course_lesson_id, user_id, is_completed, course_user_id) FROM stdin;
\.


--
-- Name: online_course_lesson_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('online_course_lesson_views_id_seq', 18, true);


--
-- Data for Name: online_course_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY online_course_lessons (id, course_id, created, description, display_order, embed_code, is_chapter, is_free, modified, name, online_lesson_type_id, thumb_url, total_viewed_count, url, user_id, is_active, what_will_students_able, title, content_type, filename, article_content, is_preview, duration, is_video_converting_is_processing, is_lesson_ready_to_view) FROM stdin;
\.


--
-- Name: online_course_lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('online_course_lessons_id_seq', 1547, true);


--
-- Data for Name: online_lesson_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY online_lesson_types (id, created, lesson_count, modified, name, slug) FROM stdin;
3	2013-02-07 10:11:00	2	2013-07-26 16:36:22.184	Video	video
4	2013-02-07 10:11:00	1	2013-07-29 19:42:18.435	Video (External/Embed)	video-external
2	2013-02-07 10:11:00	1	2013-07-29 19:52:28.995	Document	document
5	2013-02-07 10:11:00	3	2013-07-29 20:13:13.252	Downloadable File	downloadable-file
1	2013-02-07 10:11:00	11	2013-07-29 20:22:26.072	Article	article
6	2013-02-07 10:11:00	4	2013-07-29 20:22:42.507	Placeholder	place-holder
\.


--
-- Name: online_lesson_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('online_lesson_types_id_seq', 6, true);


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY pages (id, created, modified, title, content, slug, language_id) FROM stdin;
3	20:00:24.613	20:00:24.613	約	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	about	75
4	20:01:37.378	20:01:37.378	People	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	people	42
6	20:01:37.378	20:01:37.378	人	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	people	75
5	20:01:37.378	20:01:37.378	Insanlar	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	people	167
8	20:02:16.081	20:02:16.081	\r\n\r\nLiderlik	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	leadership	167
9	20:02:16.081	20:02:16.081	リーダーシップ	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	leadership	75
106	12:35:24.226	15:04:45.937	デンジャーゾーン	<h3>あなたのコースを非公開に</h3><p>あなたのコースが公開されたら、「ドラフト」モードに戻すためのオプションを持っています。すでにあなたのコースに参加した学生は、アクセス権を持っていきますが、ない新入生は入学することができなくなります。<br></p>	danger-zone	75
10	20:02:48.737	20:02:48.737	Careers	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	careers	42
12	20:02:48.753	20:02:48.753	キャリア	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	careers	75
15	20:03:23.706	20:03:23.706	パートナーズ	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	partners	75
14	20:03:23.706	20:03:23.706	Ortaklar	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	partners	167
16	20:04:03.518	20:04:03.518	Community	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	community	42
18	20:04:03.518	20:04:03.518	コミュニティ	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	community	75
104	12:35:24.194	15:08:24.843	Danger Zone	<h3>Unpublish your course<br></h3><p>Once your course is published you'll have the option to revert it to "draft" mode. Students who were already enrolled in your course will continue to have access, but no new students will be able to enroll.<br></p>	danger-zone	42
21	20:04:36.768	20:04:36.768	プログラム	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	programs	75
22	20:05:06.659	20:05:06.659	Developers	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	developers	42
20	20:04:36.768	20:04:36.768	Programlar	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	programs	167
24	20:05:06.659	20:05:06.659	デベロッパー	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	developers	75
27	20:05:37.801	20:05:37.801	条項	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	terms	75
28	20:06:20.929	20:06:20.929	Privacy Policy	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	privacy-policy	42
26	20:05:37.801	20:05:37.801	sartlar	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	terms	167
29	20:06:20.944	20:06:20.944	Gizlilik Politikasi	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	privacy-policy	167
30	20:06:20.944	20:06:20.944	個人情報保護方針	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	privacy-policy	75
33	20:06:50.274	20:06:50.274	助けて	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	help	75
34	20:07:42.948	20:07:42.948	Press	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	press	42
36	20:07:42.948	20:07:42.948	押す	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	press	75
35	20:07:42.948	20:07:42.948	Basin	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	press	167
39	20:08:23.513	20:08:23.513	我々の使命	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	our-mission	75
40	20:09:04.109	20:09:04.109	Our Team	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	our-team	42
42	20:09:04.109	20:09:04.109	私たちのチーム	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	our-team	75
1	20:00:24.598	20:00:24.598	About	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	about	42
41	20:09:04.109	20:09:04.109	Bizim takim	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	our-team	167
7	20:02:16.066	20:02:16.066	Leadership	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	leadership	42
13	20:03:23.706	20:03:23.706	Partners	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	partners	42
19	20:04:36.768	20:04:36.768	Programs	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	programs	42
45	20:10:10.674	20:10:10.674	サポート	<p>堀師スク語1室づ眞張か挑期8整ひ番授ヘケ美経ニリシナ済六えむちく文較13源ほスみで。3管ょみぴは共連チヨ会稿ふお診部かが第小ゅよく感止かぎス中則ケ負泉ミニツ会容ツ容文右オ面後ルホヲ適供困摘ゅ。業ホ万術の月球ごすひ著善フゃぴ整試ごぴあ印屋ぎン詳85市みド卵属容ヤ左紀歴ら追休障らの。<br/></p><p>会てぐそ可著ニ可経ょす真読ホケイタ面経んらを事本そる漂間イクヲレ間地つ女広ヱハ報腫リヘクル際8誕べに合種ひ防島でドれ弘択スンびへ小権王話スコロ動名延従リ。最アヨ愛産ワメモチ鼓大知季どぶぼょ会止閣リやで恵補流ネイフハ局断ヤノサモ自19月をむれぎ入6医算ハソタ補社べ性点ヲ心募レと論第オユカ険紙チイツ京台っぽず。<br/></p><p>安属まとうッ表時ツ井43棚やぴえ別最っ身治らぽゅレ処務とわリ白盛リかや点形ょわお最緩地ヌカユソ広毎みレラぶ棋26藤8分レひラ築津装スゅ。際ネヘ岡愛イい全帳版テレフケ経堅ワナノ色問ハシマ祥礼タヒナ際向えゃ各警レ思権育ロヲトワ度認スぎフも松一ア情安職ヒル由天ヱ朝十特ぽばるわ政多取ぜぴ。38記ハノ王5歌ばクゅ郡米フリ圏第割づきな兵偉囲ス今就ユツアヨ六海らどちじ辞光つぽ氷欧橋盤種え。<br/></p>	support	75
25	20:05:37.801	20:05:37.801	Terms	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	terms	42
31	20:06:50.258	20:06:50.258	Help	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	help	42
37	20:08:23.497	20:08:23.497	Our Mission	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	our-mission	42
43	20:10:10.674	20:10:10.674	Support	<p>Lorem ipsum dolor sit amet, mel et noster commune disputando, no nec suas vocibus, mel veri assueverit eu. Quo wisi vituperatoribus at, quo no vero blandit adipisci. Eam sanctus aliquando ad. Per in summo detracto. No accusamus hendrerit eum.<br/></p><p>Id mei mutat aperiri, magna iusto essent eam in, in nam modus nonumy laoreet. Qui an autem similique, pri ea illum libris vivendum, nibh noluisse corrumpit ei mei. Te mea consul molestie ullamcorper, ut iusto aliquam duo, an quo putent incorrupte. Pri vide volumus an, vel in mollis pertinax expetenda.<br/></p><p>Ne vix detraxit maluisset, augue dicta liberavisse cu pri. Ne vel harum discere saperet, id vel tacimates mediocrem. Summo repudiare dissentiunt pri at, dicam salutandi definitionem mel ne. Pro erat fastidii ponderum ut, solum audire mentitum at quo. Adhuc voluptatum comprehensam no pro.<br/></p>	support	42
103	11:11:36.613	15:09:16.5	コースのフィードバック	<h3><br>コースのフィードバック</h3><p>あなたのコースを提出した後、私たちのチームは、当社の品質基準に対してそれを確認し、学生の関与やコンバージョン率を高めるためにフィードバックを提供します。<br></p><p>次のステップのためにあなたのコースロードマップをご覧ください。<br></p>	manage-course-feedback	75
101	11:11:36.597	15:10:41.515	Course Feedback	<h3>Course Feedback<br></h3><p>After submitting your course our team will review it against our quality standards and provide feedback to increase student engagement and conversion rates.<br></p><p>Visit your Course Roadmap for next steps.<br></p>	manage-course-feedback	42
2	20:00:24.613	20:00:24.613	Hakkinda	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	about	167
105	12:35:24.226	15:06:02.125	Tehlikeli bölge	<h3>kurs yayindan kaldirin<br></h3><p>Kurs yayinlandiktan sonra size " taslak " moduna dönmek için seçenegine sahip olursunuz . zaten ders alindi ??ögrenciler erisimi devam edecek , ancak hiçbir yeni ögrenci kayit mümkün olacaktir .<br></p>	danger-zone	167
99	10:18:32.821	15:26:13.812	Ders Yol Haritasi	<h3>Sizin Kursu Olusturma<br></h3><h3>- Hazirlayin baglayin ve diger egitmenler.<br></h3><p>Diger egitmenler yüzlerce kurs yardim ve görüslerinizi alabilir Facebook , sitenin çevrimiçi egitmen topluluguna sitesi Studio katilin .</p><p>Bizim -NASIL - Create-A - Ders alin Kursu ; biz kurs olusturma her adimda size yol gösterecegiz.\r\n\r\n<br></p><h3>Plan - Kurs bir esinti olusturarak yapin.<br></h3><p>Ögrenme hedefi ayarlayin ve hedef kitlenizi belirlemek . Sen ne ögretiyoruz ? Kimi ögretiyorsunuz ?</p><p>&nbsp;Bizim ögretim stili bulmaya çalisin. Ögretme tarzi iki ucu keskin bir kiliçtir. Gerçekten zevk ya da ciddiye ögrencileri hayal kirikligina potansiyeline sahiptir . Biz mükemmel ögretme tarzi zanaat konusunda bazi bilgiler ve veriler sagladi.</p><p>müfredat Anahat . disari Harita bölüm basliklari ve bireysel dersler kurs konuyu kapsayacak. Bir ders anahat yapisini ögrenin .</p><h3>Üretin - Kurs kalp olusturun .<br></h3><div>Bir test video olusturun. tüm kurs kaydetmeden önce bizim Inceleme Ekibi video üretimi hakkinda geri bildirim alin . Test videolar hakkinda daha fazla bilgi edinin .</div><div>&nbsp;Ders dersler kaydetmeye baslayin. Size yardimci olmak için üretim kaynaklarinin bir ton var . içeriginizi ekleyin .</div><div><span>senin ders materyali yükleyin. müfredatiniza farkli içerik türleri eklemek ögrenin .\r\n\r\n<br></span></div><h3>Polonya - Kurs daha fazla ögrenci çekecek rötuslari ekleyin.</h3><div>Açilis sayfanizi olusturun ; Kurs basligini ve altyazi rafine . Kurs amaçlari, hedefleri , özet , ve egitmen bio profesyonel görünmesini saglayin. Güçlü bir ders açilis sayfasinin bir örnege bakin .</div><div>promosyon video ve resim ekleyin . unutulmaz bir ders promo video ve görüntü olusturmak için önerileri kadar okuyun - Ögrencileriniz direnmek mümkün olmayacaktir !</div><div>Kurs fiyati ayarlayin ve size ödeme yapabilirsiniz böylece prim egitmen basvurunuzu tamamlamak . Ya da ücretsiz kurs birakmak için bu adimi atlayin .</div><div><br></div><h3>incelenmesi için kurs gönderme</h3><h3>&amp; Yorum Yayinla - Biz kurs inceleyecek ve geri verecegiz.<br></h3><div>bizim kalite standartlarini karsilamaktadir sonra, otomatik olarak 5 milyon ögrenciye site pazarda üzerine yayinlanacaktir ! inceleme süreci hakkinda bilgi edinin.<br></div><div><br></div><h3>kurs yayinladiktan sonra</h3><h3><span>Sizin Kursu tesvik - çabalari ödemek olun\r\n\r\n<br></span></h3><div>En Iyi Satici Olmak için Ultimate Guide göz atin ve bizim egitmen tanitim ipuçlari ve püf noktalari bakabilirsiniz .</div><div>bazi kupon olusturun. Eger kurs tanitmak ve egitmen kuponlari ile satis yaptiginizda, satis ( kredi karti islem ücretlerini % 3 kullanin ) % 97 tutmak .</div><div>Bir sonraki ders için ögrencilerin heyecanlanmak için , ayda , ders basina iki promosyon duyurulari gönderebilirsiniz !</div><div><br></div><h3>Sizin Ögrenciler Engage - ögrenen bir topluluk kurmak<br></h3><div>Tabii pano Post tartisma sorulari fikir alisverisi kolaylastirmak için.</div><div></div><p>Kurs konu üzerinde ders degisiklikleri veya ilgili haberler hakkinda ögrencileri bilgilendirmek ders duyurulari gönderin . Ögrenciler için malzeme ile mesgul kalmak ve onlarin tutma testi yardimci olmak için müfredata yeni sinavlar eklemeyi düsünün .</p><div><br></div>	course-road-map	167
102	11:11:36.613	15:10:01.125	Ders Görüsleri	<h3>Ders Görüsleri</h3><p>kurs gönderdikten sonra ekibimiz kalite standartlarina karsi gözden ve ögrenci nisan ve dönüsüm oranlarini artirmak için geribildirim saglayacaktir.<br></p><p>Bir sonraki adimlar için Ders Yol Haritasi ziyaret edin.<br></p><p><br></p>	manage-course-feedback	167
107	12:40:14.823	15:03:49.156	Help	<p>All of us at the site want to have a great online course and teaching experience. If there is something you need assistance with or if you have any questions, we are here to help.<br></p><p><br></p><p>Have more questions or need help?&nbsp;</p><ul><li><span>&nbsp;&nbsp;</span>&nbsp;&nbsp;Refer to our Knowledge Base and ask any question!</li><li>&nbsp; &nbsp; &nbsp;Join the site Studio to meet other instructors and get helpful support from our community.</li></ul>	instructor-manage-course-help	42
98	10:18:32.758	15:35:22.484	Course Road Map	<h3>Creating Your Course</h3><h3>Prepare - Connect and fellow instructors.\r\n\r\n</h3><p>Join the site Studio on Facebook, The site's online instructor community where you can get help and feedback on your course from hundreds of other instructors.</p><p>Take our How-To-Create-A-Course Course; we'll walk you through every step of creating your course.\r\n\r\n<br></p><h3>Plan - Make creating your course a breeze.<br></h3><p>Set your learning objective and determine your audience. What are you teaching? Who are you teaching?&nbsp;</p><p>Figure out our teaching style. Your teaching style is a double-edged sword. It has the potential to truly delight or seriously disappoint your students. We have provided some insights and data on how to craft your perfect teaching style.&nbsp;</p><p>Outline your curriculum. Map out section headings and individual lectures to cover your course topic. Learn how to structure a course outline.<br></p><h3>Produce - Build the heart of your course.<br></h3><p>Create a test video. Get feedback on your video production from our Review Team before recording your entire course. Learn more about test videos.&nbsp;</p><p>Start recording your course lectures. We have a ton of production resources to help you.\r\n\r\nAdd your content.</p><p>Upload material to your lectures. Learn how to add different types of content to your curriculum.&nbsp;<br></p><h3>Polish - Add finishing touches that will attract more students to your course.<br></h3><p>Build your landing page; refine your course title and subtitle. Make your course look professional with goals, objectives, a summary, and your instructor bio. See an example of a strong course landing page.&nbsp;</p><p>Add your promo video and image. Read up on suggestions for creating an unforgettable course promo video  and image  - your students won't be able to resist!&nbsp;</p><p>Set the price of your course and complete your premium instructor application so we can pay you. Or skip this step to leave your course free.<br></p><h3>Submitting your course for review<br></h3><h3> Publish &amp; Review - We'll review your course and give feedback.<br></h3><p>Once it meets our quality standards, it will automatically be published onto the site marketplace of 5 million students! Learn about our review process.<br></p><h3>After publishing your course&nbsp;</h3><h3>Promote Your Course - Make your efforts pay off<br></h3><p>Check out our Ultimate Guide to Becoming a Best Seller, and have a look at our instructor promotion tips and tricks.</p><p>Create some coupons. When you promote your course and make a sale with your instructor coupons, you keep 97% of the sale (we use the 3% for credit card processing fees).<br></p><p>You can send up to two promotional announcements per course, per month, to get your students excited for your next course!<br></p><h3>Engage Your Students - Establish a community of learners<br></h3><p>Post discussion questions in the course dashboard to facilitate an exchange of ideas.&nbsp;</p><p>Send course announcements to inform students about changes to your course, or relevant news on your course topic.\r\n\r\nConsider adding new quizzes to your curriculum to help students stay engaged with your material and test their retention.&nbsp;<br></p>	course-road-map	42
109	12:40:14.854	15:02:28.921	助けて	<p>サイトで私たちのすべては、偉大なオンラインコースと指導経験を持っていると思います。ある場合は何か、あなたはと支援が必要か、ご質問があれば、私達は助けるためにここにいます</p><p>より多くの質問があるか、ヘルプが必要ですか。<br></p><ul><li>当社のナレッジベースを参照し、任意の質問をします！<br></li><li>他のインストラクターを満たすために、コミュニティーからの役に立つ支援を得るために、サイトのスタジオに参加。<br></li></ul>	instructor-manage-course-help	75
100	10:18:32.821	15:21:57.203	コースロードマップ	<h3>あなたのコースの作成<br></h3><h3>準備 - 接続し、仲間のインストラクター。<br></h3><p>あなたは他の講師の数百人からコース上での助けとフィードバックを得ることができ、Facebookやサイトのオンラインインストラクターのコミュニティ上のサイトのスタジオに参加。<br></p><p>私たちはどのように-TO -作成- A -コース取りコース。私たちはあなたのコースを作成するためのすべてのステップをご案内します。<br></p><h3>計画では、 - あなたのコースそよ風を作成してください。<br></h3><p>あなたの学習目標を設定し、視聴者を決定します。あなたは何を教えていますか？あなたは誰を教えていますか？</p><p>私たちの指導スタイルを把握。あなたの指導スタイルは両刃の剣です。それは本当に楽しませたり真剣にあなたの生徒を失望する可能性を秘めています。私たちはあなたの完璧な指導スタイルを作る方法についてのいくつかの洞察力とデータを提供しています</p><p>あなたのカリキュラムの概要を説明します。アウト、地図セクションの見出しおよび個々の講義は、コースのトピックをカバーします。コースの概要を構築する方法を学びます。<br></p><h3>プロデュース - あなたのコースの心を構築します。<br></h3><p>テスト映像を作成します。あなたのコース全体を記録する前に、当社のレビューチームからあなたのビデオ制作に関するフィードバックを取得します。テスト動画詳細については、こちらをご覧ください。<br></p><p>あなたのコースの講義の記録を開始します。私たちはあなたを助けるために、生産資源のトンを持っています。あなたのコンテンツを追加します。<br></p><p></p><p>あなたの講義に材料をアップロードします。あなたのカリキュラムへのコンテンツの種類を追加する方法については、こちらをご覧ください</p><div><br></div><h3>ポーランドは - あなたのコースに多くの学生を誘致する最後の仕上げを追加します。</h3><p>ランディングページを構築します。あなたのコースのタイトルとサブタイトルを絞り込みます。あなたのコースは、目標、目的、概要、およびインストラクターのバイオでプロに見せてくれます。強力なコースのランディングページの例を参照してください。</p><p>プロモーションビデオと画像を追加します。忘れられないコースのプロモーションビデオと画像を作成するための提案をよく読んで - あなたの学生は抵抗することはできません！<br></p><p>あなたのコースの価格を設定し、私たちはあなたを支払うことができるようにあなたのプレミアムインストラクターアプリケーションを完了します。または無料コースを残すために、このステップをスキップします。<br></p><h3>レビューのためにあなたのコースを提出<br></h3><h3>パブリッシュ＆レビュー - 私はあなたのコースを確認し、フィードバックを与えるでしょう。<br></h3><p>それはACE V3の品質基準を満たしていたら、それは自動的に500万の学生のACEのV3の市場に公開されます！当社のレビュープロセスについては、こちらをご覧ください。</p><h3>あなたのコースを公開した後、<br></h3><h3>あなたのコースを推進 - あなたの努力が報わしてください<br></h3><p>ベストセラーになるため、当社の究極のガイドをチェックアウトし、私たちのインストラクターのプロモーションのヒントやトリックを見ています。<br></p><p>いくつかのクーポンを作成します。あなたのコースを促進し、あなたのインストラクターのクーポンと販売を作るときは、販売（私たちはクレジットカードの処理手数料3％を使用）の97％を維持します。<br></p><p>あなたはあなたの次のコースの学生興奮する、月ごとに、コースごとに2プロモーションの発表まで送信することができます！<br></p><h3>あなたの学生をエンゲージ - 学習者のコミュニティを確立<br></h3><p>コースのダッシュボードのポストディスカッション質問はアイデアの交換を容易にします。\r\n\r\nあなたのコースのトピックについてのあなたのコースへの変更、または関連するニュースを学生に知らせるためにコースのアナウンスを送信します。<br></p><p>学生は自分の材料と係合滞在し、それらの保持をテスト助けるためにあなたのカリキュラムに新しいクイズを追加することを検討してください。</p>	course-road-map	75
11	20:02:48.753	20:02:48.753	Kariyer	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	careers	167
17	20:04:03.518	20:04:03.518	topluluk	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	community	167
23	20:05:06.659	20:05:06.659	Gelistiriciler	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	developers	167
32	20:06:50.258	20:06:50.258	Yardim Edin	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	help	167
38	20:08:23.513	20:08:23.513	Görevimiz	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	our-mission	167
44	20:10:10.674	20:10:10.674	Destek	<p>Lorem ipsum dolor mel et Noster komün disputando , hiçbir yerde siniflandirilmamis suas vocibus , mel veri assueverit eu , sit amet . Quo wisi vituperatoribus , Resim Vero blandit adipisci quo de . Eam sanctus aliquando reklam . Ortalama olarak summo detracto . Hiçbir accusamus hendrerit eum .</p><p>Kimligi mei mutat aperiri , magna iusto Essent EAM olarak , nam modus nonumy laoreet içinde . Qui bir Sorgulama similique , pri ea illum libris Vivendum , nibh noluisse corrumpit ei mei . Te mea konsolos molestie ullamcorper , ut iusto Aliquam ikilisi , bir quo putent incorrupte . Pri vide bir volumus , vel in mollis Pertinax expetenda .</p><p>Ne vix detraxit maluisset , augue dicta liberavisse cu pri . Ne vel harum discere saperet id vel tacimates mediocrem . Summo repudiare dissentiunt pri , Dicam salutandi definitionem mel NE at . quo Pro, erat fastidii ponderum ut , solum audire mentitum . Adhuc voluptatum comprehensam hiçbir yanlisi .<br></p><p><br></p>	support	167
108	12:40:14.839	15:03:31.109	Yardim Edin	<p>yerinde Hepimiz büyük bir online ders ve ögretim deneyimine sahip istiyorum . varsa bir sey yardima ihtiyaciniz veya herhangi bir sorunuz varsa , biz yardimci olmak için buradayiz .<br></p><p>Daha fazla sorunuz varsa veya yardima ihtiyaciniz ?</p><ul><li>Bizim Bilgi Bankasi'ndaki bakin ve herhangi bir soru sormak !&nbsp;</li><li>diger ögretmenleri tanisma ve eden yardimci destek almak için site Studio katilin .</li></ul>	instructor-manage-course-help	167
\.


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('pages_id_seq', 109, true);


--
-- Data for Name: provider_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY provider_users (id, created, modified, user_id, provider_id, access_token, access_token_secret, is_connected, profile_picture_url, foreign_id) FROM stdin;
\.


--
-- Name: provider_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('provider_users_id_seq', 1, false);


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY providers (id, created, modified, name, secret_key, api_key, icon_class, button_class, is_active, display_order) FROM stdin;
1	2015-12-23 11:34:19.114	2015-12-23 11:34:19.114	Facebook	\N	\N	fa-facebook	btn-facebook	t	1
2	2015-12-23 11:35:47.708	2015-12-23 11:35:47.708	Twitter	\N	\N	fa-twitter	btn-twitter	t	2
3	2015-12-23 11:36:56.755	2015-12-23 11:36:56.755	Google	\N	\N	fa-google-plus	btn-google	t	3
\.


--
-- Name: providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('providers_id_seq', 3, true);


--
-- Data for Name: setting_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY setting_categories (id, created, modified, parent_id, name, description, display_order) FROM stdin;
3	\N	\N	0	Revenue	Revenue Details 	3
2	\N	\N	0	SEO And Metadata	Manage content, meta data and other information relevant to browsers or search engines	2
1	\N	\N	1	Site Information 	Here you can modify site related settings such as site name.	1
6	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	0	Analytics	Manage Google and Facebook analytics code here	6
7	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	0	MOOC Affiliate	Manage MOOC Affiliate Credentials	7
8	2016-01-12 00:02:38.923	2016-01-12 00:02:38.923	0	Follow Us	Here you can manage site's social network links. Enter full URL, Leave it blank if not available.	8
9	2016-01-12 00:02:38.923	2016-01-12 00:02:38.923	0	Course	Here you can manage course related settings.	9
10	2016-03-03 18:48:38.484	2016-03-03 18:48:38.484	0	Comments	Here you can manage Facebook comments and Disqus Comment	10
11	2016-03-03 18:50:57.734	2016-03-03 18:50:57.734	0	Plugins	Here you can modify site related plugins.	11
4	\N	2016-02-03 11:45:18.57	0	SudoPay	Manage Site's SudoPay Gateway settings	4
12	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	0	PayPal	PayPal Details	12
5	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	0	Withdrawal	Here manage Minimum and Maximum withdraw transaction	5
13	2016-04-16 12:27:37.375	2016-04-16 12:27:37.375	0	Banner	Banner for all page bottom, all page top, course page sidebar, profile page sidebar.	13
14	2016-04-27 17:43:11.125	2016-04-27 17:43:11.125	0	Video	Here you can manage video related settings.	14
\.


--
-- Name: setting_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('setting_categories_id_seq', 14, true);


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY settings (id, name, value, setting_category_id, display_order, created, modified, label, description) FROM stdin;
58	mooc_affiliate.course_limit	1000	7	3	\N	\N	Course Limit	\N
1	site.name	ACE V3	1	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Site Name	This name will used in all pages and emails.
2	site.version	3.0b1	1	2	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Site Version	This site version will used in all pages.
6	site.contact_email	productdemo.admin@gmail.com	1	7	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Contact Email	This is the email address to which you will receive the mail from contact form.
7	site.common_from_email	productdemo.admin@gmail.com	1	8	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Common From Email	This is the email address that will appear in the "From" field of all emails sent from the site.
8	site.common_reply_to		1	9	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Common Reply to Email	"Reply-To" email header for all emails. Leave it empty to receive replies as usual (to "From" email address).
5	site.default_language	en	1	3	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Site Dafault Language	This language will be used as default language all over the site.
18	site.currency_code	USD	1	5	2015-11-17 04:29:29.983	2015-11-17 04:29:29.983	Currency Code	This currency code will be used in courses list, transactions list and also for emails if the currency symbol is not available.
44	site.timezone	+0530	1	10	2016-03-17 10:45:31.796	2016-03-17 10:45:31.796	Site TimeZone	This is the site timezone that will used for all the time displaying.
9	meta.robots		2	3	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Robots	Content for robots.txt; (search engine) robots specific instructions. Refer,http://www.robotstxt.org/ for syntax and usage.
11	revenue.commission_percentage	5	3	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Commission Percentage	This is the site commission percentage which will be taken from lecturer when the learner purchasing the course.
12	revenue.minimum_site_commission_amount	1	3	2	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Minimum Site Commission Amount	This is the site's minimum commission amount.
17	payment.is_live_mode	0	4	6	\N	\N	Live Mode?	This is the site's "SudoPay" gateway live mode setting.
46	analytics.is_enabled_google_analytics	0	6	1	2016-03-30 20:08:01.69	2016-03-30 20:08:01.69	Enabled Google Analytics?	It is for enable/disable the google analytics by giving 0 or 1.
23	analytics.google_analytics.profile_id		6	2	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	Google Analytics Profile ID	It is the site's google analytics profile ID.
24	analytics.facebook_analytics.pixel		6	4	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	Facebook Pixel ID	It is the site's facebook analytics pixel ID.
47	analytics.is_enabled_facebook_pixel	0	6	3	2016-03-30 20:08:01.722	2016-03-30 20:08:01.722	Enabled Facebook Pixel?	It is for enable/disable the facebook pixel by giving 0 or 1.
28	social_networks.facebook		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Facebook Page URL	This is the site's "Facebook" page url to follow the site.
30	social_networks.google_plus		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Google Plus URL	This is the site's "Google+" url displayed in the footer.
31	social_networks.linkedin		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	LinkedIn URL	This is the site's "Linkedin" url displayed in the footer.
33	social_networks.pinterest		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Pinterest URL	This is the site's "Pinterest" url displayed in the footer.
34	social_networks.flickr		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Flickr URL	This is the site's "Flickr" url displayed in the footer.
36	social_networks.tumblr		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Tumblr URL	This is the site's "Tumblr" url displayed in the footer.
37	social_networks.youtube		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	YouTube URL	This is the site's "Youtube" channel url displayed in the footer.
38	social_networks.vimeo		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Vimeo URL	This is the site's "Vimeo" url displayed in the footer.
48	facebook.is_enabled_facebook_comment	0	10	1	2016-03-30 20:08:01.784	2016-03-30 20:08:01.784	Enabled Facebook Comment in Course Page?	It is for enable/disable the "Facebook Comment in Course Page" by giving 0 or 1.
57	paypal.is_live_mode	0	12	6	2016-03-30 20:08:02.987	2016-03-30 20:08:02.987	Live Mode?	This is the site "PayPal" live mode setting.
26	site.currency_symbol	$	1	6	2015-11-17 04:29:29.983	2015-11-17 04:29:29.983	Currency Symbol	This currency symbol used as default currency symbol at courses list, transactions list and also for emails.
21	withdrawals.minimum_withdraw_amount	100	5	0	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	Minimum Withdrawal Amount	This is the minimum amount a user can withdraw from their wallet.
3	meta.keywords	Online Courses, ACE, Agriya, Clone Script	2	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Meta Keywords	These are the keywords used for improving search engine results of our site. (Comma separated for multiple keywords).
27	site.site_languages	en,ja,tr	1	4	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Site Languages	These are the site's available languages. The user can select any one of the language in the site and seeing the site content by their selected language
13	payment.sudopay_merchant_id		4	2	\N	\N	Sudopay Merchant ID	This is the site's "SudoPay" gateway merchant ID.
14	payment.sudopay_website_id		4	3	\N	\N	Sudopay Website ID	This is the site's "SudoPay" gateway website ID.
4	meta.meta_description	ACE V3 is an online education marketplace with limitless variety: over 6 million students enrolled in more than 20,000 courses, taught by 10,000 instructors.	2	2	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Meta Description	This is the short description of your site, used by search engines on search result pages to display preview snippets for a given page.
32	social_networks.foursquare		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Foursquare URL	This is the site's "foursquare" url displayed in the footer.
35	social_networks.instagram		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Instagram URL	This is the site's "Instagram" url displayed in the footer.
39	course.is_auto_approval_enabled	0	9	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Allow Lecturer Publish Their Course?	It is for allowing the lecturers to publish their course.
49	disqus.is_enabled_disqus_comment	0	10	4	2016-03-30 20:08:01.816	2016-03-30 20:08:01.816	Enabled Disqus Comment in Course Page?	It is for enable/disable the "Disqus Comment in Course Page" by giving 0 or 1.
59	course.max_course_fee	1000	9	1	\N	\N	Maximum Course Fee	This is the maximum course fee a teacher can set price for their own course
60	banner.all_page_top	\N	13	1	2016-04-16 12:27:37.406	2016-04-16 12:27:37.406	Banner All Page Top	Banner for all page top in the site.
61	banner.all_page_bottom	<img src="http://placehold.it/728X90" alt ="728X90" width="728" height="90"/>	13	2	2016-04-16 12:27:37.406	2016-04-16 12:27:37.406	Banner All Page Bottom	Banner for all page bottom in the site.
62	banner.profile_page_sidebar	<img src="http://placehold.it/320X90" alt ="320X90" width="320" height="90"/>	13	3	2016-04-16 12:27:37.406	2016-04-16 12:27:37.406	Banner Profile Page Sidebar	Banner for profile page sidebar in the site.
63	banner.course_page_sidebar	<img src="http://placehold.it/320X90" alt ="320X90" width="320" height="90"/>	13	4	2016-04-16 12:27:37.406	2016-04-16 12:27:37.406	Banner Course Page Sidebar	Banner for course page sidebar in the site.
22	withdrawals.maximum_withdraw_amount	5000	5	0	2016-01-29 12:50:25.331	2016-01-29 12:50:25.331	Maximum Withdrawal Amount	This is the maximum amount a user can withdraw from their wallet.
65	video.is_enabled_promo_video	1	14	1	\N	\N	Promo Video	This to enable/disable promo video for courses by giving 0 or 1.
66	video.max_size_to_allow_video_file	1024	14	1	\N	\N	Video File Size Limitation	Here you can set the maximum file size for videos and the file size should be in megabytes(MB).
67	video.is_keep_original_video_file_in_server	1	14	1	\N	\N	Keep Original Video File	This is to keep/delete original video files in server by giving 0 or 1.
15	payment.sudopay_secret_string		4	5	\N	\N	Sudopay Secret	This is the site's "SudoPay" gateway secret string.
16	payment.sudopay_api_key		4	4	\N	\N	Sudopay Api Key	This is the site's "SudoPay" gateway api key.
20	site.enabled_plugins		11	1	2015-12-30 14:36:22.474	2015-12-30 14:36:22.474	Enabled Plugins	\N
25	mooc_affiliate.affiliate_id		7	1	2016-01-29 12:50:25.316	2016-01-29 12:50:25.316	Affiliate ID	This the MOOC affiliate ID.
29	social_networks.twitter		8	1	2015-11-12 00:02:38.923	2015-11-12 00:02:38.923	Twitter URL	This is the site's "Twitter" url displayed in the footer.
40	mooc_affiliate.affiliate_api_key		7	1	2016-03-07 19:49:47.123	2016-03-07 19:49:47.123	Affiliate Api Key	This the MOOC affiliate api key.
41	facebook.admin.userid		10	3	\N	\N	Facebook Admin User ID	This is the site admin's facebook user ID.
42	disqus.comments.shortname		10	5	\N	\N	Disqus Comment - Short Name	This is the disqus comment short name.
45	facebook.comments.api_key		10	2	\N	\N	Facebook API Key	This is the facebook comment api key.
50	paypal.api_username		12	2	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	PayPal Api Username	This is the site "PayPal" api username.
51	paypal.api_password		12	3	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	PayPal Api Password	This is the site "PayPal" api password.
52	paypal.api_signature		12	4	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	PayPal Api Signature	This is the site "PayPal" api signature.
53	paypal.api_id		12	5	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	PayPal Api ID	This is the site "PayPal" api ID.
54	paypal.api_account_email		12	6	2016-03-30 20:08:01.831	2016-03-30 20:08:01.831	PayPal Api Account Email	This is the site "PayPal" api account email.
\.


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('settings_id_seq', 67, true);


--
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: -
--

COPY states (id, created, modified, country_id, name, is_active) FROM stdin;
\.


--
-- Name: states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('states_id_seq', 5264, true);


--
-- Data for Name: subscription_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY subscription_statuses (id, created, modified, name) FROM stdin;
1	2015-12-23 13:49:14.584	2015-12-23 13:49:14.584	Initiated
2	2015-12-23 13:49:31.099	2015-12-23 13:49:31.099	Active
3	2015-12-23 13:49:56.256	2015-12-23 13:49:56.256	Pending Payment
4	2015-12-23 13:50:08.365	2015-12-23 13:50:08.365	Canceled
5	2015-12-23 13:50:08.365	2015-12-23 13:50:08.365	Expired
\.


--
-- Name: subscription_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('subscription_statuses_id_seq', 5, true);


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY subscriptions (id, created, modified, name, price, interval_unit, trial_period_price, trial_period_days, interval_period, is_active, description) FROM stdin;
1	2015-12-23 11:21:21.031	2015-12-23 11:21:21.031	Basic	19	Month	0	0	1	t	<ul><li>Learn course with access to 1000+ videos<br></li><li>Enjoy exclusive bonus content<br></li><li>Access basic level courses<br></li><li>Get refund if not satisfied in first 7 days<br></li></ul>
2	2015-12-23 11:21:58.609	2015-12-23 11:21:58.609	Premium	29	Month	0	0	1	t	<ul><li>Learn course with access to 1000+ videos<br></li><li>Enjoy exclusive bonus content<br></li><li>Access all level courses<br></li><li>Get refund if not satisfied in first 7 days<br></li></ul>
\.


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('subscriptions_id_seq', 2, true);


--
-- Data for Name: sudopay_payment_gateways; Type: TABLE DATA; Schema: public; Owner: -
--

COPY sudopay_payment_gateways (id, created, modified, sudopay_gateway_name, sudopay_gateway_details, is_marketplace_supported, sudopay_gateway_id, sudopay_payment_group_id, form_fields_credit_card, form_fields_manual, form_fields_buyer, thumb_url, supported_features_actions, supported_features_card_types, supported_features_countries, supported_features_credit_card_types, supported_features_currencies, supported_features_languages, supported_features_services, connect_instruction, name) FROM stdin;
\.


--
-- Name: sudopay_payment_gateways_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('sudopay_payment_gateways_id_seq', 23, true);


--
-- Data for Name: sudopay_payment_gateways_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY sudopay_payment_gateways_users (id, created, modified, user_id, sudopay_payment_gateway_id) FROM stdin;
\.


--
-- Name: sudopay_payment_gateways_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('sudopay_payment_gateways_users_id_seq', 3, true);


--
-- Data for Name: sudopay_payment_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY sudopay_payment_groups (id, created, modified, sudopay_group_id, name, thumb_url) FROM stdin;
\.


--
-- Name: sudopay_payment_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('sudopay_payment_groups_id_seq', 1, false);


--
-- Data for Name: sudopay_transaction_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY sudopay_transaction_logs (id, created, modified, amount, payment_id, model, foreign_id, sudopay_pay_key, merchant_id, gateway_id, gateway_name, status, payment_type, buyer_id, buyer_email, buyer_address) FROM stdin;
\.


--
-- Name: sudopay_transaction_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('sudopay_transaction_logs_id_seq', 3, true);


--
-- Data for Name: transaction_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY transaction_types (id, created, is_credit, message, modified, name, transaction_variables, admin_message, buyer_message, teacher_message, is_credit_for_buyer, is_credit_for_teacher, is_balance_added_in_wallet) FROM stdin;
1	2013-07-16 13:41:33.971	1	\N	2013-07-16 13:41:33.971	Bought new course	BUYER COURSE COURSE_AMOUNT	{{BUYER}} bought course - {{COURSE}}	You bought course - {{COURSE}}	{{BUYER}} bought your course - {{COURSE}}	0	1	0
\.


--
-- Name: transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('transaction_types_id_seq', 2, true);


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY transactions (id, amount, classname, created, description, foreign_id, modified, site_commission_amount, transaction_type_id, user_id, teacher_user_id) FROM stdin;
\.


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('transactions_id_seq', 23, true);


--
-- Name: translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('translations_id_seq', 1, false);


--
-- Name: upload_access_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('upload_access_logs_id_seq', 1, false);


--
-- Name: upload_service_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('upload_service_types_id_seq', 3, true);


--
-- Name: upload_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('upload_services_id_seq', 4, true);


--
-- Name: upload_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('upload_settings_id_seq', 6, true);


--
-- Name: uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('uploads_id_seq', 763, true);


--
-- Data for Name: user_cash_withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_cash_withdrawals (id, created, modified, user_id, withdrawal_status_id, amount, money_transfer_account_id) FROM stdin;
\.


--
-- Name: user_cash_withdrawals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_cash_withdrawals_id_seq', 3, true);


--
-- Data for Name: user_logins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_logins (id, created, modified, provider_type, user_agent, user_id, user_login_ip_id) FROM stdin;
\.


--
-- Name: user_logins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_logins_id_seq', 1062, true);


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_notifications (id, created, is_learner_course_favorite_new_class, is_learner_course_favorite_new_lesson, is_learner_subscription_new_course, is_learner_user_follow_new_class, is_learner_user_follow_new_course, is_teacher_course_favorited, is_teacher_offline_course_booked, is_teacher_online_course_booked, is_teacher_user_followed, modified, user_id) FROM stdin;
\.


--
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_notifications_id_seq', 829, true);


--
-- Data for Name: user_subscription_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_subscription_logs (id, created, modified, user_id, user_subscription_id, subscription_id, subscription_start_date, subscription_end_date, sudopay_payment_id, paykey, amount, subscription_status_id) FROM stdin;
\.


--
-- Name: user_subscription_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_subscription_logs_id_seq', 1, false);


--
-- Data for Name: user_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_subscriptions (id, created, modified, user_id, subscription_id, vault_key, sudopay_gateway_id, buyer_email, buyer_address, buyer_city, buyer_state, buyer_country, buyer_zip_code, buyer_phone, subscription_status_id, last_payment_attempt, sudopay_paypal_subscription_id, paypal_subscr_id, payment_gateway_id, subscription_canceled_date, is_cancel_requested) FROM stdin;
\.


--
-- Name: user_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_subscriptions_id_seq', 1, false);


--
-- Name: user_upload_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_upload_stats_id_seq', 678, true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY users (id, providertype, accesstoken, authmethod, created, displayname, email, isemailverified, is_agree_terms_conditions, is_suspend, lastaccess, last_login_ip_id, modified, password, random_id, secret, token, user_login_count, sudopay_receiver_account_id, is_active, total_spend, total_earned, total_site_revenue_amount, course_count, course_user_count, course_user_feedback_count, username, user_image, image_hash, register_ip_id, last_logged_in_time, designation, headline, biography, website, facebook_profile_link, twitter_profile_link, google_plus_profile_link, linkedin_profile_link, youtube_profile_link, meta_keywords, meta_description, available_balance, is_teacher, is_student, total_withdrawn_amount) FROM stdin;
1	admin	\N	USER_PASSWORD	2013-07-15 21:08:23.043	admin	productdemo.admin@gmail.com	1	1	0	1375110922734	\N	2016-04-18 13:50:09.572	$2a$10$peYDujUo1AFvotEJ.hsuDuGuLUsfOAWybIOVku4/.S0inNl0GxohO	\N	\N	\N	0	0	t	0	0	0	0	0	0	admin	\N	\N	0	2016-04-18 13:50:09.572	\N	\N	\N	\N	\N	\N	\N	\N	\N		\N	0	0	1	0
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('users_id_seq', 827, true);


--
-- Data for Name: withdrawal_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY withdrawal_statuses (id, created, modified, name) FROM stdin;
1	2016-01-14 17:29:31.126	2016-01-14 17:29:31.126	Pending
2	2016-01-14 17:29:49.454	2016-01-14 17:29:49.454	Under Process
3	2016-01-14 17:30:03.142	2016-01-14 17:30:03.142	Rejected
4	2016-01-14 17:30:19.111	2016-01-14 17:30:19.111	Amount Transferred
\.


--
-- Name: withdrawal_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('withdrawal_statuses_id_seq', 4, true);



--
-- Name: categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: course_favourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY course_favourites
    ADD CONSTRAINT course_favourites_pkey PRIMARY KEY (id);


--
-- Name: course_levels_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY instructional_levels_subscriptions
    ADD CONSTRAINT course_levels_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: course_user_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY course_user_feedbacks
    ADD CONSTRAINT course_user_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: course_user_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY course_user_statuses
    ADD CONSTRAINT course_user_statuses_pkey PRIMARY KEY (id);


--
-- Name: course_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY course_users
    ADD CONSTRAINT course_users_pkey PRIMARY KEY (id);


--
-- Name: courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: instructional_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY instructional_levels
    ADD CONSTRAINT instructional_levels_pkey PRIMARY KEY (id);


--
-- Name: ips_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY ips
    ADD CONSTRAINT ips_pkey PRIMARY KEY (id);


--
-- Name: languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: money_transfer_accounts_id; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY money_transfer_accounts
    ADD CONSTRAINT money_transfer_accounts_id PRIMARY KEY (id);


--
-- Name: online_course_lesson_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY online_course_lesson_views
    ADD CONSTRAINT online_course_lesson_views_pkey PRIMARY KEY (id);


--
-- Name: online_course_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY online_course_lessons
    ADD CONSTRAINT online_course_lessons_pkey PRIMARY KEY (id);


--
-- Name: online_lesson_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY online_lesson_types
    ADD CONSTRAINT online_lesson_types_pkey PRIMARY KEY (id);


--
-- Name: pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: provider_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY provider_users
    ADD CONSTRAINT provider_users_pkey PRIMARY KEY (id);


--
-- Name: providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: states_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: subscription_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY subscription_statuses
    ADD CONSTRAINT subscription_statuses_pkey PRIMARY KEY (id);


--
-- Name: subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY transaction_types
    ADD CONSTRAINT transaction_types_pkey PRIMARY KEY (id);


--
-- Name: transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_logins_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_logins
    ADD CONSTRAINT user_logins_pkey PRIMARY KEY (id);


--
-- Name: user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_subscription_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_subscription_logs
    ADD CONSTRAINT user_subscription_logs_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: course_user_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER course_user_count AFTER INSERT OR DELETE OR UPDATE ON course_users FOR EACH ROW EXECUTE PROCEDURE course_user_count();


--
-- Name: total_withdrawn_amount; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER total_withdrawn_amount AFTER INSERT OR DELETE OR UPDATE ON user_cash_withdrawals FOR EACH ROW EXECUTE PROCEDURE total_withdrawn_amount();


--
-- Name: update_course_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_count AFTER INSERT OR DELETE OR UPDATE ON online_course_lessons FOR EACH ROW EXECUTE PROCEDURE update_course_count();


--
-- Name: update_course_lesson_display_order; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_lesson_display_order AFTER INSERT ON online_course_lessons FOR EACH ROW EXECUTE PROCEDURE update_course_lesson_display_order();


--
-- Name: update_course_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_rating AFTER INSERT OR DELETE OR UPDATE ON course_user_feedbacks FOR EACH ROW EXECUTE PROCEDURE update_course_rating();


--
-- Name: categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;


--
-- Name: cities_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cities
    ADD CONSTRAINT cities_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;


--
-- Name: cities_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY cities
    ADD CONSTRAINT cities_state_id_fkey FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL;


--
-- Name: contacts_ip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_ip_id_fkey FOREIGN KEY (ip_id) REFERENCES ips(id) ON DELETE SET NULL;


--
-- Name: contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: course_favourites_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_favourites
    ADD CONSTRAINT course_favourites_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;


--
-- Name: course_favourites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_favourites
    ADD CONSTRAINT course_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: course_user_feedbacks_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_user_feedbacks
    ADD CONSTRAINT course_user_feedbacks_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;


--
-- Name: course_user_feedbacks_course_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_user_feedbacks
    ADD CONSTRAINT course_user_feedbacks_course_user_id_fkey FOREIGN KEY (course_user_id) REFERENCES course_users(id) ON DELETE CASCADE;


--
-- Name: course_user_feedbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_user_feedbacks
    ADD CONSTRAINT course_user_feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: course_users_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_users
    ADD CONSTRAINT course_users_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;


--
-- Name: course_users_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_users
    ADD CONSTRAINT course_users_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;


--
-- Name: course_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY course_users
    ADD CONSTRAINT course_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;


--
-- Name: courses_instructional_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_instructional_level_id_fkey FOREIGN KEY (instructional_level_id) REFERENCES instructional_levels(id) ON DELETE SET NULL;


--
-- Name: courses_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_language_id_fkey FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE SET NULL;


--
-- Name: courses_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL;


--
-- Name: courses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY courses
    ADD CONSTRAINT courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: instructional_levels_subscriptions_instructional_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY instructional_levels_subscriptions
    ADD CONSTRAINT instructional_levels_subscriptions_instructional_level_id_fkey FOREIGN KEY (instructional_level_id) REFERENCES instructional_levels(id) ON DELETE CASCADE;


--
-- Name: instructional_levels_subscriptions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY instructional_levels_subscriptions
    ADD CONSTRAINT instructional_levels_subscriptions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;


--
-- Name: ips_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ips
    ADD CONSTRAINT ips_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;


--
-- Name: ips_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ips
    ADD CONSTRAINT ips_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;


--
-- Name: ips_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY ips
    ADD CONSTRAINT ips_state_id_fkey FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL;


--
-- Name: money_transfer_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY money_transfer_accounts
    ADD CONSTRAINT money_transfer_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: online_course_lesson_views_course_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY online_course_lesson_views
    ADD CONSTRAINT online_course_lesson_views_course_user_id_fkey FOREIGN KEY (course_user_id) REFERENCES course_users(id) ON DELETE CASCADE;


--
-- Name: online_course_lesson_views_online_course_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY online_course_lesson_views
    ADD CONSTRAINT online_course_lesson_views_online_course_lesson_id_fkey FOREIGN KEY (online_course_lesson_id) REFERENCES online_course_lessons(id) ON DELETE CASCADE;


--
-- Name: online_course_lesson_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY online_course_lesson_views
    ADD CONSTRAINT online_course_lesson_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: online_course_lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY online_course_lessons
    ADD CONSTRAINT online_course_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;


--
-- Name: online_course_lessons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY online_course_lessons
    ADD CONSTRAINT online_course_lessons_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: pages_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY pages
    ADD CONSTRAINT pages_language_id_fkey FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE;


--
-- Name: provider_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY provider_users
    ADD CONSTRAINT provider_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: states_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY states
    ADD CONSTRAINT states_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL;


--
-- Name: sudopay_payment_gateways_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY sudopay_payment_gateways_users
    ADD CONSTRAINT sudopay_payment_gateways_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: user_cash_withdrawals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_cash_withdrawals
    ADD CONSTRAINT user_cash_withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: user_logins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_logins
    ADD CONSTRAINT user_logins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: user_logins_user_login_ip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_logins
    ADD CONSTRAINT user_logins_user_login_ip_id_fkey FOREIGN KEY (user_login_ip_id) REFERENCES ips(id) ON DELETE SET NULL;


--
-- Name: user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: user_subscription_logs_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_subscription_logs
    ADD CONSTRAINT user_subscription_logs_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;


--
-- Name: user_subscription_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_subscription_logs
    ADD CONSTRAINT user_subscription_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_subscriptions
    ADD CONSTRAINT user_subscriptions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: users_last_login_ip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_last_login_ip_id_fkey FOREIGN KEY (last_login_ip_id) REFERENCES ips(id) ON DELETE SET NULL;


--
-- Name: public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


UPDATE "settings" SET "value" = 'VideoLessons, Subscriptions, SocialShare, SocialLogins, RatingAndReview, UserProfile, CourseWishlist, Instructor, Comments, SEO, PayPal' WHERE name = 'site.enabled_plugins';

UPDATE "settings" SET "value" = 'Skillr' WHERE "name" = 'site.name';

--
-- PostgreSQL database dump complete
--
