npm link
// noinspection JSUnusedGlobalSymbols

import axios from "axios";

import {CastingError} from "./type-cast-error.js";

import {Convert as ConvertLeague} from "./types/league.js";
import {Convert as ConvertMatchDetails} from "./types/match-details.js";
import {Convert as ConvertMatches} from "./types/matches.js";
import {Convert as ConvertPlayer} from "./types/player.js";
import {Convert as ConvertTeam} from "./types/team.js";
import {Convert as ConvertTransfers} from "./types/transfers.js";
import {Convert as ConvertAllLeagues} from "./types/all-leagues.js";
import {Convert as ConvertWorldNews} from "./types/world-news.js";
import {Convert as ConvertTeamSeasonStats} from "./types/team-season-stats.js";

const baseUrl = "https://www.fotmob.com/api/";

export default class Fotmob {
    constructor() {
        this.cache = new Map();
        this.xmas = undefined;

        this.matchesUrl = `${baseUrl}matches?`;
        this.leaguesUrl = `${baseUrl}leagues?`;
        this.allLeaguesUrl = `${baseUrl}allLeagues?`;
        this.teamsUrl = `${baseUrl}teams?`;
        this.teamsSeasonStatsUrl = `${baseUrl}/teamseasonstats?`;
        this.playerUrl = `${baseUrl}playerData?`;
        this.matchDetailsUrl = `${baseUrl}matchDetails?`;
        this.searchUrl = `${baseUrl}searchapi/`;
        this.transfersUrl = `${baseUrl}transfers?`;
        this.worldNewsUrl = `${baseUrl}worldnews?`;

        this.initializeAxios();
    }

    initializeAxios() {
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            timeout: 10000,
            headers: {
                "Accept": 'application/json',
                "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // Add request interceptor to include x-mas in headers
        this.axiosInstance.interceptors.request.use(async (config) => {
            if (!this.xmas) {
                await this.ensureInitialized();
            }
            config.headers["x-mas"] = this.xmas;
            return config;
        });
    }

    checkDate(date) {
        const re = /(20\d{2})(\d{2})(\d{2})/;
        return re.exec(date);
    }

    async safeTypeCastFetch(url, fn) {
        try {
            if (this.cache.has(url)) {
                return fn(this.cache.get(url));
            }

            const response = await this.axiosInstance.get(url);

            if (response.data?.error) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(JSON.stringify(response.data));
            }

            this.cache.set(url, JSON.stringify(response.data));

            try {
                return fn(JSON.stringify(response.data));
            } catch (err) {
                if (err instanceof CastingError) {
                    return response.data;
                }

                // noinspection ExceptionCaughtLocallyJS
                throw err;
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`HTTP error! status: ${error.response.status}`);
            } else if (error.request) {
                throw new Error('No response received from the server');
            } else {
                throw new Error('Error setting up request: ' + error.message);
            }
        }
    }

    async ensureInitialized() {
        if (!this.xmas) {
            const response = await axios.get("http://46.101.91.154:6006/");
            this.xmas = response.data["x-mas"];
        }
    }

    async getMatchesByDate(date) {
        if (this.checkDate(date) != null) {
            const url = `matches?date=${date}`;
            return await this.safeTypeCastFetch(url, ConvertMatches.toMatches);
        }
    }

    async getLeague(id, tab = "overview", type = "league", timeZone = "America/New_York") {
        const url = `leagues?id=${id}&tab=${tab}&type=${type}&timeZone=${timeZone}`;
        return await this.safeTypeCastFetch(url, ConvertLeague.toLeague);
    }

    async getAllLeagues() {
        return await this.safeTypeCastFetch("allLeagues", ConvertAllLeagues.toAllLeagues);
    }

    async getTeam(id, tab = "overview", type = "team", timeZone = "America/New_York") {
        const url = `teams?id=${id}&tab=${tab}&type=${type}&timeZone=${timeZone}`;
        return await this.safeTypeCastFetch(url, ConvertTeam.toTeam);
    }

    async getTeamSeasonStats(teamId, seasonId) {
        const url = `teamseasonstats?teamId=${teamId}&tournamentId=${seasonId}`;
        return await this.safeTypeCastFetch(url, ConvertTeamSeasonStats.toTeamSeasonStats);
    }

    async getPlayer(id) {
        const url = `playerData?id=${id}`;
        return await this.safeTypeCastFetch(url, ConvertPlayer.toPlayer);
    }

    async getMatchDetails(matchId) {
        const url = `matchDetails?matchId=${matchId}`;
        return await this.safeTypeCastFetch(url, ConvertMatchDetails.toMatchDetails);
    }

    async getWorldNews({page = 1, lang = "en"} = {}) {
        const url = `worldnews?page=${page}&lang=${lang}`;
        return await this.safeTypeCastFetch(url, ConvertWorldNews.toWorldNews);
    }

    async getTransfers({page = 1, lang = "en"} = {}) {
        const url = `transfers?page=${page}&lang=${lang}`;
        return await this.safeTypeCastFetch(url, ConvertTransfers.toTransfers);
    }

    async request(path, params) {
        const url = `${path}?${new URLSearchParams(params)}`;
        return await this.safeTypeCastFetch(url, (data) => JSON.parse(data));
    }
}