import { Player, world, Dimension, Entity, Vector, MolangVariableMap,DynamicPropertiesDefinition,WorldInitializeAfterEvent,EntityTypes } from "@minecraft/server";
import * as Tool from "../libs/scarletToolKit"

export default class PowerPoint {
    static init_scoreboard_world(){
        if(world.scoreboard.getObjective("p") == null){
            world.getDimension("overworld").runCommand("scoreboard objectives add p dummy power");
        }
    }
    /**
     * @param {WorldInitializeAfterEvent} event 
     */
    static init_dynamic_properties(event){
        let def = new DynamicPropertiesDefinition();
        def.defineString("target", 12);
    
        event.propertyRegistry.registerEntityTypeDynamicProperties(def, EntityTypes.get("touhou_little_maid:p_point"));
    }
    /**
     * 
     * @param {Entity} en 
     */
    static init_power_point(en){
        en.applyImpulse(this.get_velocity_xp_orb());
    }
    /**
     * 
     * @param {Entity} en 
     * @param {Dimension} dimension 
     */
    static powerpoint_hit(en, dimension){
        // int count = 30 + this.level.random.nextInt(30) + this.level.random.nextInt(30);
        // may outside of the world
        try{
            // may inside a block
            let summon_location = en.location;
            if(dimension.getBlock(en.location).typeId != "minecraft:air"){
                summon_location = new Vector(en.location.x, Math.ceil(en.location.y), en.location.z);
            }
            
            this.summon_power_velocity(Math.ceil(Tool.getRandom(30, 90)), dimension, summon_location, [en.getVelocity().x/2, 0, en.getVelocity().z/2]);
            var molang = new MolangVariableMap();
            molang = molang.setColorRGBA("variable.color", {
                alpha: 0,
                blue: 61,
                green: 255,
                red: 75
            });
            dimension.spawnParticle("touhou_little_maid:splash_power_point", summon_location, molang);
        }
        catch{}
        en.triggerEvent("despawn");
    }
    
    /**
     * Scan tick of Power Point System
     */
    static scan_tick(){
        for(let pl of world.getPlayers()){
            this.scan_gohei(pl);
            this.scan_player(pl);
        }
    }
    
    /**
     * Scan power point near the player
     * @param {Player} pl 
     */
    static scan_player(pl){
        const results = pl.dimension.getEntities({
            type: 'touhou_little_maid:p_point',
            maxDistance: 5,
            location: pl.location
        });
    
        for(let en of results){
            if(en.getDynamicProperty("target") == ""){
                en.triggerEvent("scan_start");
                en.setDynamicProperty("target", pl.name);
            }
        }
    }
    
    /**
     * Show power number to player by title at action bar
     * @param {Player} pl 
     */
    static scan_gohei(pl){
        let playerContainer2 = pl.getComponent("inventory").container;
        let item = playerContainer2.getItem(pl.selectedSlot);
        
        if(item && item.typeId == "touhou_little_maid:hakurei_gohei") {
            Tool.title_player_actionbar(pl.name, `§cP: ${ (this.get_power_number(pl.name)/100).toFixed(2) }`);
        }
    }
    
    /**
     * Set the vector of power point to player
     * @param {Entity} en 
     */
    static scan_powerpoint(en){
        let player_name = en.getDynamicProperty("target");
        let pl_list = world.getPlayers({name: player_name});
        if(pl_list.length == 0){
            en.setDynamicProperty("target", "");
            en.triggerEvent("scan_stop");
        }
        else{
            let pl = pl_list[0];
            let pl_headLocation = pl.getHeadLocation();
            let delta_y = pl_headLocation.y - en.location.y;
            // Follow box (xzy): 11 × 11 × 7
            let delta_x = pl_headLocation.x - en.location.x;
            let delta_z = pl_headLocation.z - en.location.z;
            if(    -5 < delta_x && delta_x < 5 
                && -5 < delta_z && delta_z < 5 
                && -3 < delta_y && delta_y < 6)
            {
                // Score box (xzy): 3 × 3 × 4
                if(    -1 < delta_x && delta_x < 1 
                    && -1 < delta_z && delta_z < 1
                    && -2 < delta_y && delta_y < 1)
                {
                    // PS. Fariy loot: 2*0p + 2*2p (16 points)
                    let point_score = this.get_power_number(pl.name);
    
                    // If this power point has tag, add by tag number
                    let is_taged = false;
                    for(let tag of en.getTags()){
                        if(tag.substring(0, 6) == "thlm:p"){
                            point_score += parseInt(tag.substring(6));
                            is_taged = true;
                            break;
                        }
                    }
    
                    // If not, add by default
                    if(!is_taged){
                        switch(en.getComponent("minecraft:variant").value){
                            case 0: point_score += 1  ; break;
                            case 1: point_score += 4  ; break;
                            case 2: point_score += 7  ; break;
                            case 3: point_score += 10  ; break;
                            case 4: point_score += 500; break;
                            default: break;
                        }
                    }
                    this.set_power_number(pl.name, Math.min(500, point_score));
                    Tool.executeCommand(`playsound power_pop ${Tool.playerCMDName(pl.name)}`);
                    en.triggerEvent("despawn");
                }
                // ​If not in the score box, do storm suction
                else{
                    let distance = Math.sqrt(delta_x*delta_x + delta_z*delta_z);
    
                    let velocity_xz = (distance > 1) ? (0.2 - distance * 0.025) : (distance * 0.175);
                    let v_x = velocity_xz*(delta_x/distance);
                    let v_z = velocity_xz*(delta_z/distance);
                
                    let v_y = en.getVelocity().y - 0.036; // gravity
                    if(-1.5 < delta_x && delta_x < 1.5
                        && -1.5 < delta_z && delta_z < 1.5
                        && delta_y > 1){
                            v_y = (delta_y > 0) ? (0.35 - delta_y * 0.025) : (delta_y * 0.3);
                        }
                    en.clearVelocity()
                    en.applyImpulse(new Vector(v_x, v_y, v_z));
                }
            }
            else{
                en.triggerEvent("scan_stop");
                en.setDynamicProperty("target", "");
            }
        }
    }
    
    /**
     * Get player power point number in scoreboard (xxx)
     * @param {string} name
     * @returns {interger}
     */
    static get_power_number(name){
        let scores = world.scoreboard.getObjective("p").getScores()
        for(let s of scores){
            if(s.participant.displayName == name){
                return s.score;
            }
        }
        world.getDimension("overworld").runCommand(`scoreboard players add ${Tool.playerCMDName(name)} p 0`);
        return 0;
    }
    
    /**
     * Set player power point number (xxx)
     * @param {string} name 
     * @param {interger} number 
     */
    static set_power_number(name, number){
        world.getDimension("overworld").runCommand(`scoreboard players set ${Tool.playerCMDName(name)} p ${number}`);
    }
    
    /**
     * 
     * @param {number} count 
     * @param {Dimension} dimension 
     * @param {Location} location 
     * @param {Array} velocity 
     */
    static summon_power_velocity(count_, dimension, location, velocity){
        let count = count_;
        const overworld = world.getDimension("overworld");
        while(true){
            let temp = dimension.spawnEntity("touhou_little_maid:p_point", location);
            let drectionX = Tool.getRandom() < 0.5 ? 1 : -1;
            let drectionZ = Tool.getRandom() < 0.5 ? 1 : -1;
            
            temp.applyImpulse(new Vector(velocity[0] + drectionX * Tool.getRandom(0, 0.2),
                                        velocity[1] + Tool.getRandom(0, 0.4),
                                        velocity[2] + drectionZ * Tool.getRandom(0, 0.2)));
            if(count >= 32){
                temp.triggerEvent("init_ns_p4");
                temp.addTag("thlm:p32");
                count -= 32;
            }
            else if(count >= 16){
                temp.triggerEvent("init_ns_p4");
                temp.addTag("thlm:p16");
                count -= 16;
            }
            else if(count >= 10){
                temp.triggerEvent("init_ns_p4");
                count -= 10;
            }
            else if(count >= 7){
                temp.triggerEvent("init_ns_p3");
                count -= 7;
            }
            else if(count >= 4){
                temp.triggerEvent("init_ns_p2");
                count -= 4;
            }
            else if(count >= 0){
                temp.triggerEvent("init_ns_p1");
                count -= 1;
            }
            if(count <= 0) return true;
        }
        return false;
    }
    
    static get_velocity_xp_orb(base_velocity){
        let drectionX = Tool.getRandom() < 0.5 ? 1 : -1;
        let drectionZ = Tool.getRandom() < 0.5 ? 1 : -1;
        return new Vector(drectionX * Tool.getRandom(0, 0.2),
                                  Tool.getRandom(0, 0.4),
                                  drectionZ * Tool.getRandom(0, 0.2));
    }
}