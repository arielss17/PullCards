const UserRepository = require('../repositories/UserRepository');
const ExpansionRepository = require('../repositories/ExpansionRepository');
const AppError = require('../helpers/AppError');

const MAX_SUMMONS = 6;
const SUMMON_COOLDOWN_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

class EnergyService {
    static calculateSummons(user) {
        let { availableSummons = MAX_SUMMONS, lastSummonAt } = user;

        if (availableSummons >= MAX_SUMMONS || !lastSummonAt) {
            return { availableSummons: MAX_SUMMONS, lastSummonAt: null, nextSummonAt: null };
        }

        const now = Date.now();
        const last = new Date(lastSummonAt).getTime();
        const elapsed = now - last;
        const earned = Math.floor(elapsed / SUMMON_COOLDOWN_MS);

        if (earned > 0) {
            availableSummons = Math.min(MAX_SUMMONS, availableSummons + earned);
            if (availableSummons === MAX_SUMMONS) {
                lastSummonAt = null; // Reached max, stop counting
            } else {
                lastSummonAt = new Date(last + (earned * SUMMON_COOLDOWN_MS)).toISOString();
            }
        }

        const nextSummonAt = lastSummonAt ? new Date(new Date(lastSummonAt).getTime() + SUMMON_COOLDOWN_MS).toISOString() : null;

        return { availableSummons, lastSummonAt, nextSummonAt };
    }

    static async checkAndGrantBonuses(user) {
        let updated = false;
        if (!user.expansionBonus) {
            user.expansionBonus = {};
            updated = true;
        }

        const allExpansions = await ExpansionRepository.findAll();
        const now = Date.now();

        for (const exp of allExpansions) {
            // Check if expansion has an active bonus
            if (exp.loginDeadline && new Date(exp.loginDeadline).getTime() > now && exp.bonusSummonsQty > 0) {
                // If user hasn't claimed it yet
                if (!user.expansionBonus[exp.id]) {
                    user.expansionBonus[exp.id] = {
                        charges: exp.bonusSummonsQty,
                        claimedAt: new Date().toISOString()
                    };
                    updated = true;
                }
            }
        }

        if (updated) {
            await UserRepository.save(user);
        }
        return user;
    }

    static async getUserStatus(userId, expansionId = null) {
        let user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        user = await this.checkAndGrantBonuses(user);

        const status = this.calculateSummons(user);

        // Update user if state changed (lazy update)
        if (status.availableSummons !== user.availableSummons || status.lastSummonAt !== user.lastSummonAt) {
            await UserRepository.save({ ...user, ...status });
        }

        let bonusCharges = 0;
        if (expansionId && user.expansionBonus && user.expansionBonus[expansionId]) {
            bonusCharges = user.expansionBonus[expansionId].charges || 0;
        }

        return {
            availableSummons: status.availableSummons,
            maxSummons: MAX_SUMMONS,
            nextSummonAt: status.nextSummonAt,
            bonusCharges
        };
    }

    static async consumeEnergy(userId, expansionId = null) {
        let user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado.', 404);
        }

        user = await this.checkAndGrantBonuses(user);

        let consumedBonus = false;
        // Dual Currency Priority: Check expansion bonus first
        if (expansionId && user.expansionBonus && user.expansionBonus[expansionId]) {
            if (user.expansionBonus[expansionId].charges > 0) {
                user.expansionBonus[expansionId].charges -= 1;
                consumedBonus = true;
            }
        }

        if (!consumedBonus) {
            let status = this.calculateSummons(user);
            if (status.availableSummons <= 0) {
                throw new AppError('Sem energia. Aguarde o retorno do poder de invocação.', 403);
            }
            status.availableSummons -= 1;
            if (!status.lastSummonAt) {
                status.lastSummonAt = new Date().toISOString();
            }
            Object.assign(user, status);
        }

        await UserRepository.save(user);
        return { success: true, consumedBonus };
    }
}

module.exports = EnergyService;
