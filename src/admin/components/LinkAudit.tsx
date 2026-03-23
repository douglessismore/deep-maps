import { useMemo } from 'react';
import { useAdminData } from '../AdminDataProvider';

interface LinkAuditProps {
  entityIds: string[];
  momentId: string;
  parentStories: string[];
}

export function LinkAudit({ entityIds, momentId: _momentId, parentStories }: LinkAuditProps) {
  const { appData } = useAdminData();

  // Resolve entity names
  const entityChips = useMemo(() => {
    return entityIds.map(eid => {
      const entity = appData.entities.find(e => e.id === eid);
      return { id: eid, name: entity?.name ?? eid, type: entity?.type };
    });
  }, [entityIds, appData.entities]);

  // Resolve story names
  const storyNames = useMemo(() => {
    return parentStories.map(sid => {
      const story = appData.stories.find(s => s.id === sid);
      return { id: sid, name: story?.name ?? sid };
    });
  }, [parentStories, appData.stories]);

  return (
    <div className="space-y-3">
      {/* Linked Entities */}
      <div>
        <div className="text-[10px] text-gray-600 font-mono mb-1">Linked Entities</div>
        {entityChips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {entityChips.map(e => (
              <span
                key={e.id}
                className="px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded"
                title={`${e.id} (${e.type ?? 'unknown'})`}
              >
                {e.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/20 rounded px-2 py-1">
            No entity links
          </div>
        )}
      </div>

      {/* Parent Stories */}
      <div>
        <div className="text-[10px] text-gray-600 font-mono mb-1">Parent Stories</div>
        {storyNames.length > 0 ? (
          <div className="space-y-0.5">
            {storyNames.map(s => (
              <div key={s.id} className="text-xs text-gray-400" title={s.id}>
                {s.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/20 rounded px-2 py-1">
            Orphan moment — not in any story
          </div>
        )}
      </div>
    </div>
  );
}
