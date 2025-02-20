import Fotmob from "./dist/fotmob.js"

const fotmob = new Fotmob();

(async() => {
    const leagues = await fotmob.getTeam(9831);

    console.log(leagues);
})();
