/**
 * PlayerSession - Manages the local frontend state of the user for Summoning.
 * Interacts with the backend via ApiClient for the actual RNG resolution.
 */
const PlayerSession = (() => {
    const createGameState = () => ({
        collection: [],
        history: [],
        energy: {
            available: 0,
            max: 6,
            nextSummonAt: null
        }
    });

    const canSummon = (state) => state.energy.available > 0;

    const performSummon = async (state) => {
        if (!canSummon(state)) {
            return { success: false, reason: "Sem energia." };
        }

        try {
            const user = AuthManager.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const response = await ApiClient.post(`/api/collection/${user.id}/roll`);

            if (response.success) {
                const result = response.rollData;

                // Keep local UI state in sync
                state.energy.available -= 1;
                state.collection.push(...result.cards);
                state.history.push(result);

                return { success: true, result };
            } else {
                return { success: false, reason: response.error || "Erro ao evocar." };
            }
        } catch (error) {
            console.error("[PlayerSession] Summon failed", error);
            return { success: false, reason: error.message || "Erro de comunicação com o servidor." };
        }
    };

    return {
        createGameState,
        canSummon,
        performSummon
    };
})();
