const SummonService = require('./server/services/SummonService');
const MonsterRepository = require('./server/repositories/MonsterRepository');

// Mock getConfig temporarily internally or via the real service
async function runTest() {
    try {
        console.log("Mocking overrides for test...");

        // Mock the getConfig method to return a specific override config
        SummonService.getConfig = async () => ({
            monsterOverrides: {
                "dnd5e_dragon_gold": { dropWeight: 9900 }, // 99%
                "dnd5e_goblin": { dropWeight: 100 } // 1%
            }
        });

        // We mock the monster list returned from the repo to isolate the findCards function
        MonsterRepository.findAllByExpansion = async () => [
            { id: "dnd5e_dragon_gold", name: "Gold Dragon", tier: "S", table: "table1" },
            { id: "dnd5e_goblin", name: "Goblin", tier: "S", table: "table1" }
        ];

        console.log("Executing 10000 pulls for Table1 / Tier S...");
        let goldDragonCount = 0;
        let goblinCount = 0;

        for (let i = 0; i < 10000; i++) {
            const result = await SummonService.findCards("dnd5e", "table1", "S", 1);
            if (result[0].id === 'dnd5e_dragon_gold') goldDragonCount++;
            if (result[0].id === 'dnd5e_goblin') goblinCount++;
        }

        console.log(`Results from 10,000 pulls:`);
        console.log(`Gold Dragon (9900 Weight): ${goldDragonCount} (${((goldDragonCount / 10000) * 100).toFixed(2)}%)`);
        console.log(`Goblin (100 Weight): ${goblinCount} (${((goblinCount / 10000) * 100).toFixed(2)}%)`);

        console.log(
            goldDragonCount > 9000 ?
                "✅ TEST PASSED: Weighted Random is functioning perfectly." :
                "❌ TEST FAILED: Weighted Random is not biased correctly."
        );
        process.exit(0);

    } catch (e) {
        console.error("Test failed to run:", e);
        process.exit(1);
    }
}
runTest();
