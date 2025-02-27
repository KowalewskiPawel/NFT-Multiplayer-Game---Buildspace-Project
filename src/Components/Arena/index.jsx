import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../../consts";
import transformCharacterData from "../../utils/transformCharacterData";
import getCharacterImage from "../../utils/getCharacterImage";
import cryptoFighters from "../../abi/cryptoFighters.json";
import LoadingIndicator from "../LoadingIndicator";
import schiff from "../../assets/schiff.jpeg";
import "./Arena.css";

const Arena = ({ characterNFT, setCharacterNFT }) => {
  const [gameContract, setGameContract] = useState(null);
  // const [players, setPlayers] = useState([]);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState("");
  const [showToast, setShowToast] = useState(false);

  const runAttackAction = async () => {
    try {
      if (gameContract) {
        if (characterNFT.hp === 0) {
          alert("Your character is dead :(");
          return;
        }

        setAttackState("attacking");
        const txn = await gameContract.attackBoss();
        await txn.wait();
        setAttackState("hit");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error attacking boss:", error);
      setAttackState("");
    }
  };

  /*

  const renderActivePlayersList = async () => {
    try {
      if (gameContract) {
        const activePlayers = [];
        const playersCount = await gameContract.getAllCharacters();

        for (let i = 1; i <= playersCount; i++) {
          activePlayers.push(
            transformCharacterData(await gameContract.nftHolderAttributes(i))
          );
        }

        setPlayers(activePlayers);
      }
    } catch (error) {
      console.error(error);
    }
  };

  */

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        cryptoFighters.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);

  useEffect(() => {
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log("Boss:", bossTxn);
      setBoss(transformCharacterData(bossTxn));
    };

    const onAttackComplete = (newBossHp, newPlayerHp) => {
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();

      setBoss((prevState) => {
        return { ...prevState, hp: bossHp };
      });

      setCharacterNFT((prevState) => {
        return { ...prevState, hp: playerHp };
      });
    };

    if (gameContract) {
      fetchBoss();
      gameContract.on("AttackComplete", onAttackComplete);
    }

    return () => {
      if (gameContract) {
        gameContract.off("AttackComplete", onAttackComplete);
      }
    };
  }, [gameContract]);

  return (
    <div className='arena-container'>
      {boss && characterNFT && (
        <div id='toast' className={showToast ? "show" : ""}>
          <div id='desc'>{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}
      {boss && (
        <div className='boss-container'>
          <div className={`boss-content  ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className='image-content'>
              <img src={schiff} alt={`Boss ${boss.name}`} />
              <div className='health-bar'>
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className='attack-container'>
            <button
              className={`cta-button ${characterNFT.hp === 0 && "disabled"}`}
              onClick={runAttackAction}>
              {`💥 Attack ${boss.name}`}
            </button>
          </div>
          {attackState === "attacking" && (
            <div className='loading-indicator'>
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}

      {characterNFT && (
        <div className='players-container'>
          <div className='player-container'>
            <h2>Your Character</h2>
            <div className='player'>
              <div className='image-content'>
                <h2>{characterNFT.name}</h2>
                <img
                  className={characterNFT.hp === 0 ? "dead" : ""}
                  src={getCharacterImage(characterNFT.name)}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className='health-bar'>
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className='stats'>
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
          </div>
          {/*
          <div className='active-players'>
            <h2>Active Players</h2>
            <div className='players-list'>
              {players &&
                players.map((character, index) => {
                  return (
                    <div className='character-item' key={character.name}>
                      <div className='name-container'>
                        <p>{character.name}</p>
                      </div>
                      <img
                        src={getCharacterImage(character.name)}
                        alt={character.name}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
              */}
        </div>
      )}
    </div>
  );
};

export default Arena;
