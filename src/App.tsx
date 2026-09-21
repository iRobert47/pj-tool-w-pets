/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TodaySchedule } from './components/TodaySchedule';
import { ProjectBoard } from './components/ProjectBoard';
import { QuickLogView } from './components/QuickLogView';
import { PetSanctuary } from './components/PetSanctuary';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ExportStudio } from './components/ExportStudio';
import { PrdViewer } from './components/PrdViewer';
import {
  INITIAL_ACHIEVEMENTS,
  INITIAL_NOTES,
  INITIAL_PETS,
  INITIAL_PROJECTS,
  INITIAL_SCHEDULE,
} from './data/initialData';
import { Achievement, Pet, Project, QuickNote, ScheduleItem, ViewTab } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('today-schedule');
  const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_SCHEDULE);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [pets, setPets] = useState<Pet[]>(INITIAL_PETS);
  const [activePetId, setActivePetId] = useState<string>('pet-miaomiao');
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [notes, setNotes] = useState<QuickNote[]>(INITIAL_NOTES);
  const [streakDays, setStreakDays] = useState<number>(14);
  const [targetPomodoroTask, setTargetPomodoroTask] = useState<ScheduleItem | null>(null);

  const activePet = pets.find((p) => p.id === activePetId) || pets[0];

  const handleIntimacyGain = (amount: number) => {
    setPets((allPets) =>
      allPets.map((p) =>
        p.id === activePetId
          ? { ...p, intimacy: Math.min(500, p.intimacy + amount) }
          : p
      )
    );
  };

  const handleFeed = (amount: number) => {
    setPets((allPets) =>
      allPets.map((p) =>
        p.id === activePetId
          ? {
              ...p,
              hunger: Math.min(100, p.hunger + amount),
              intimacy: Math.min(500, p.intimacy + 8),
            }
          : p
      )
    );
  };

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id === taskId) {
          const newStatus = !item.completed;
          // Pet reward if completed
          if (newStatus) {
            setPets((allPets) =>
              allPets.map((p) =>
                p.id === activePetId
                  ? {
                      ...p,
                      hunger: Math.min(100, p.hunger + 15),
                      intimacy: Math.min(500, p.intimacy + 20),
                    }
                  : p
              )
            );
          }
          return { ...item, completed: newStatus, fedCan: newStatus };
        }
        return item;
      })
    );
  };

  // Switch pet
  const handleSwitchPet = (petId: string) => {
    setActivePetId(petId);
  };

  // Add new project
  const handleAddProject = (newProjectData: Partial<Project>) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectData.name || '新專案',
      category: newProjectData.category || '自研專案',
      status: newProjectData.status || '進行中',
      progress: newProjectData.progress || 10,
      latestMemo: newProjectData.latestMemo || '已完成專案立項，等待首次手帳記錄。',
      latestMemoTime: '剛剛',
      noteCount: 0,
      fishRewards: newProjectData.fishRewards || 30,
      members: newProjectData.members || ['凡'],
      dueDate: newProjectData.dueDate || '11/30',
      startDate: newProjectData.startDate || '10/24',
      phaseDesc: newProjectData.phaseDesc || '起步階段 (10%)',
    };
    setProjects((prev) => [newProj, ...prev]);
  };

  // Save quick note & feed pet
  const handleSaveNote = (note: QuickNote) => {
    setNotes((prev) => [note, ...prev]);

    // Update pet hunger, intimacy & level
    setPets((allPets) =>
      allPets.map((p) => {
        if (p.id === activePetId) {
          const updatedHunger = Math.min(100, p.hunger + (note.snack === 'tuna' ? 20 : 15));
          const updatedIntimacy = Math.min(500, p.intimacy + 30);
          return {
            ...p,
            hunger: updatedHunger,
            intimacy: updatedIntimacy,
            mood: '活力滿滿 🥰',
          };
        }
        return p;
      })
    );

    // Update corresponding project progress and latest memo
    if (note.projectId) {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id === note.projectId) {
            const nextProgress = Math.min(100, proj.progress + (note.progressShift || 10));
            return {
              ...proj,
              progress: nextProgress,
              latestMemo: note.title,
              latestMemoTime: '剛剛',
              noteCount: proj.noteCount + 1,
            };
          }
          return proj;
        })
      );
    }
  };

  // Pet micro-action feedback
  const handlePetActionFeedback = (action: string) => {
    setPets((allPets) =>
      allPets.map((p) => {
        if (p.id === activePetId) {
          if (action === 'pet') {
            return { ...p, intimacy: Math.min(500, p.intimacy + 5) };
          }
          if (action === 'toy') {
            return { ...p, mood: '開心興奮 🐾' };
          }
          if (action === 'dress') {
            return { ...p, mood: '神氣十足 ✨' };
          }
        }
        return p;
      })
    );
  };

  // Start Pomodoro for a specific task
  const handleStartPomodoroForTask = (task: ScheduleItem) => {
    setTargetPomodoroTask(task);
    setCurrentTab('pomodoro');
  };

  // Finish Pomodoro session
  const handleFinishPomodoro = (rewardFish: number, rewardIntimacy: number) => {
    setPets((allPets) =>
      allPets.map((p) =>
        p.id === activePetId
          ? {
              ...p,
              intimacy: Math.min(500, p.intimacy + rewardIntimacy),
              hunger: Math.min(100, p.hunger + 10),
            }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] text-[#181c1b] font-sans antialiased selection:bg-[#ffdea9] selection:text-[#271900]">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        streakDays={streakDays}
      />

      {/* Main Content Area */}
      <main className="pt-20 pb-12 transition-all">
        {currentTab === 'today-schedule' && (
          <TodaySchedule
            pet={activePet}
            schedule={schedule}
            onToggleTask={handleToggleTask}
            onNavigate={setCurrentTab}
            onStartPomodoroForTask={handleStartPomodoroForTask}
            onPetTouch={() => handlePetActionFeedback('pet')}
            onIntimacyGain={handleIntimacyGain}
            onFeed={handleFeed}
          />
        )}

        {currentTab === 'project-board' && (
          <ProjectBoard
            projects={projects}
            onAddProject={handleAddProject}
            onOpenQuickLogForProject={(proj) => {
              setCurrentTab('quick-log');
            }}
          />
        )}

        {currentTab === 'quick-log' && (
          <QuickLogView
            pet={activePet}
            projects={projects}
            onSaveNote={handleSaveNote}
            onClose={() => setCurrentTab('today-schedule')}
          />
        )}

        {currentTab === 'pet-sanctuary' && (
          <PetSanctuary
            pets={pets}
            activePetId={activePetId}
            onSwitchPet={handleSwitchPet}
            achievements={achievements}
            onPetActionFeedback={handlePetActionFeedback}
            onIntimacyGain={handleIntimacyGain}
            onFeed={handleFeed}
          />
        )}

        {currentTab === 'pomodoro' && (
          <PomodoroTimer
            pet={activePet}
            targetTask={targetPomodoroTask}
            onFinishPomodoro={handleFinishPomodoro}
            onSwitchTask={() => setCurrentTab('today-schedule')}
          />
        )}

        {currentTab === 'export-studio' && (
          <ExportStudio
            pet={activePet}
            projects={projects}
            notes={notes}
          />
        )}

        {currentTab === 'prd' && <PrdViewer />}
      </main>

      {/* Bottom Mobile Navigation */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />
    </div>
  );
}
