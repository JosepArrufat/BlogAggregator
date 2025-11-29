import path from "path";
import fs from "fs";
import os from "os";

export type Config = {
    dbUrl:  string,
    currentUserName: string,
};
function getConfigFilePath():string{
    const homeDir = os.homedir();
    return path.join(homeDir, ".gatorconfig.json");
}
export function setUser(username: string):void{
    const filePath = getConfigFilePath();
    const rawConfig = JSON.parse(fs.readFileSync(filePath, {encoding:"utf-8"}));
    let gatorconfig: Config = {
        dbUrl: rawConfig.db_url,
        currentUserName: rawConfig.current_user_name
    };
    
    gatorconfig.currentUserName = username;
    const jsonConfig = {
        db_url: gatorconfig.dbUrl,
        current_user_name: gatorconfig.currentUserName
    };
    
    const gatorconfigJSON = JSON.stringify(jsonConfig);
    try{
        fs.writeFileSync(filePath, gatorconfigJSON, { encoding: "utf8" });
    }catch (error) {
        if(error instanceof Error){
            console.error("Failed to write file:", error.message);
        }
    }
};

export function readConfig():Config{
    const filePath = getConfigFilePath();
    try{
        const rawConfig = JSON.parse(fs.readFileSync(filePath, {encoding:"utf-8"}));
        return {
            dbUrl: rawConfig.db_url ,
            currentUserName: rawConfig.current_user_name
        };
    }catch (error) {
        if(error instanceof Error){
            console.error("Failed to read file:", error.message);
        } 
        return {
            dbUrl: "postgres://example",
            currentUserName: ""
        }
    }
}



