/**
 * 带sigma的自机狙（星型）
 */
import { Vector } from "../../../libs/VectorMC";
import { BulletShoot } from "../../shoots/BulletShoot";
import { EntityDanmakuActor } from "../../actors/EntityDanmakuActor";
import { GeneralBullet, GeneralBulletColor, GeneralBulletType } from "../../shapes/main";
import { getRandom } from "../../../libs/ScarletToolKit";
import { system } from "@minecraft/server";
export class FairyPatternTest3 {
    shoot(thrower, target) {
        let bulletShootSmall = new BulletShoot({
            thrower: new EntityDanmakuActor(thrower)
                .setOffset(new Vector(0, 1, 0)),
            target: new EntityDanmakuActor(target)
                .setOffset(new Vector(0, 1, 0)),
            shape: new GeneralBullet()
                .setColor(GeneralBulletColor.RANDOM)
                .setGeneralBulletType(GeneralBulletType.STAR)
                .setDamage(6)
        });
        let bulletShootBig = new BulletShoot({
            thrower: new EntityDanmakuActor(thrower)
                .setOffset(new Vector(0, 1, 0)),
            target: new EntityDanmakuActor(target)
                .setOffset(new Vector(0, 1, 0)),
            shape: new GeneralBullet()
                .setColor(GeneralBulletColor.RANDOM)
                .setGeneralBulletType(GeneralBulletType.BIG_STAR)
                .setDamage(6)
        });
        for (let i = 0; i < 20; i++) {
            system.runTimeout(() => {
                bulletShootSmall.shootByTarget(getRandom(0.3, 1), Math.PI / 7);
                bulletShootSmall.shootByTarget(getRandom(0.3, 1), Math.PI / 7);
                bulletShootSmall.shootByTarget(getRandom(0.3, 1), Math.PI / 7);
                bulletShootBig.shootByTarget(getRandom(0.3, 1), Math.PI / 15);
                bulletShootBig.shootByTarget(getRandom(0.3, 1), Math.PI / 15);
            }, i + 10);
        }
        return true;
    }
}
//# sourceMappingURL=FairyPatternTest3.js.map